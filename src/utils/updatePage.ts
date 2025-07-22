import { debounce } from "./debounce";
import { supabase } from "../supabaseClient";
import { Page } from "./types";


export const updatePage = debounce(async (page: Partial<Page> & Pick<Page, "id">) => {
    await supabase.from("pages").update(page).eq("id", page.id);
}, 500);