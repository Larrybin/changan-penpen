-- Ensure idempotent credit top-ups per Creem order
-- Allows multiple NULLs; enforces uniqueness only when creem_order_id is provided
CREATE UNIQUE INDEX IF NOT EXISTS credits_history_creem_order_id_unique
ON public.credits_history(creem_order_id)
WHERE creem_order_id IS NOT NULL;

