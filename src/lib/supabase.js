import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------
// Credenciales del proyecto Supabase
// (la clave "publishable" es pública por diseño: viaja al navegador
//  y solo da acceso a lo que permiten las políticas RLS)
// ---------------------------------------------------------------
export const SUPABASE_URL = "https://rquddcbkaovqplcobifd.supabase.co";
export const SUPABASE_ANON_KEY =
  "sb_publishable_5K0PvBiJYNhBtBGDO3wVSg_Xn1nm8ll";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
