-- ============================================================
-- Corrección: en un panel compartido, cualquier miembro ve y
-- edita TODAS las filas del panel (no solo las que creó).
-- El acceso se gobierna por workspace, no por user_id.
-- ============================================================

drop policy if exists "panel products" on public.products;
drop policy if exists "panel sales"    on public.sales;
drop policy if exists "panel expenses" on public.expenses;

create policy "panel products" on public.products
  for all
  using (workspace_id = auth.uid() or public.is_member(workspace_id))
  with check (workspace_id = auth.uid() or public.is_member(workspace_id));

create policy "panel sales" on public.sales
  for all
  using (workspace_id = auth.uid() or public.is_member(workspace_id))
  with check (workspace_id = auth.uid() or public.is_member(workspace_id));

create policy "panel expenses" on public.expenses
  for all
  using (workspace_id = auth.uid() or public.is_member(workspace_id))
  with check (workspace_id = auth.uid() or public.is_member(workspace_id));
