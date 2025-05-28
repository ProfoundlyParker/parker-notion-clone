import { nanoid } from "nanoid";
import { supabase } from "../supabaseClient";

export const createPage = async () => {
	const { data: userData } = await supabase.auth.getUser();
	const user = userData.user;
	if (!user) {
		throw new Error("You must be logged in to create a page.");
	}
	const slug = nanoid();

	const page = {
		title: "Untitled Page",
		slug,
		nodes: [],
		created_by: user.id,
		emoji: ""
	};

	const { data: insertedPages, error: insertError } = await supabase
        .from("pages")
        .insert(page)
        .select("id, slug, title, nodes, created_by, emoji")
        .single();

    if (insertError) {
        throw insertError;
    }

    return insertedPages;
};