import { supabase } from "../supabaseClient";

export const uploadImage = async (file?: File) => {
        if (!file) {
            throw new Error("You must select an image to upload")
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = fileName;

        const { data, error } = await supabase.storage.from("images").upload(filePath, file);

        if (error) {
            throw new Error(`Failed to upload image: ${error.message}`)
        }

        if (data) {
            return {filePath, fileName}
        }
}