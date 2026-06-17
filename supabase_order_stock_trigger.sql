-- Run this in the Supabase SQL editor.
-- Stock is reserved only when an order first moves into confirmed/completed.
-- It accepts both technical statuses and visible Ukrainian labels:
-- pending / В процесi, confirmed / Підтверджено, completed / Виконано, rejected / Вiдхилено.
-- Moving confirmed/completed back to pending/rejected restores the stock.

create or replace function public.sync_product_stock_from_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    item jsonb;
    item_id bigint;
    item_qty integer;
    was_reserved boolean;
    is_reserved boolean;
    old_status text;
    new_status text;
begin
    if tg_op <> 'UPDATE' or old.status is not distinct from new.status then
        return new;
    end if;

    old_status := lower(trim(coalesce(old.status::text, '')));
    new_status := lower(trim(coalesce(new.status::text, '')));

    was_reserved := old_status in (
        'confirmed',
        'completed',
        lower('Підтверджено'),
        lower('Виконано')
    );

    is_reserved := new_status in (
        'confirmed',
        'completed',
        lower('Підтверджено'),
        lower('Виконано')
    );

    if was_reserved = is_reserved then
        return new;
    end if;

    for item in select * from jsonb_array_elements(new.items::jsonb)
    loop
        item_id := coalesce(item ->> 'id', item ->> 'product_id')::bigint;
        item_qty := coalesce(item ->> 'qty', item ->> 'quantity')::integer;

        if item_id is null or item_qty is null or item_qty <= 0 then
            continue;
        end if;

        if is_reserved then
            update public."Products"
            set stock = stock - item_qty
            where id = item_id
              and stock >= item_qty;

            if not found then
                raise exception 'Not enough stock for product %', item_id;
            end if;
        else
            update public."Products"
            set stock = stock + item_qty
            where id = item_id;
        end if;
    end loop;

    return new;
end;
$$;

drop trigger if exists orders_status_stock_sync on public.orders;

create trigger orders_status_stock_sync
after update of status on public.orders
for each row
execute function public.sync_product_stock_from_order_status();

-- Optional check after running this script:
-- select trigger_name, event_manipulation
-- from information_schema.triggers
-- where event_object_schema = 'public'
--   and event_object_table = 'orders'
--   and trigger_name = 'orders_status_stock_sync';
