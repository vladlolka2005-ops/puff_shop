-- Run this in the Supabase SQL editor.
-- Stock is reserved only when an order first moves into confirmed/completed.
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
begin
    if tg_op <> 'UPDATE' or old.status is not distinct from new.status then
        return new;
    end if;

    was_reserved := old.status in ('confirmed', 'completed');
    is_reserved := new.status in ('confirmed', 'completed');

    if was_reserved = is_reserved then
        return new;
    end if;

    for item in select * from jsonb_array_elements(new.items::jsonb)
    loop
        item_id := (item ->> 'id')::bigint;
        item_qty := (item ->> 'qty')::integer;

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
