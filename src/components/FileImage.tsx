import { forwardRef, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Loader } from "./Loader";
import styles from "../utils.module.css";

type FileImageProps = {
    filePath: string;
	onLoad?: () => void;
} & React.ImgHTMLAttributes<HTMLImageElement>

export const FileImage = forwardRef<HTMLImageElement, FileImageProps>(
    ({ filePath, onLoad, ...props }, ref) => {
    const [image, setImage] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const downloadImage = async (filePath: string) => {
            try {
            setLoading(true)
            const { data, error } = await supabase.storage.from("images").download(filePath);
            if (error) {
                throw error;
            }
            if (data) {
                const url = URL.createObjectURL(data);
                setImage(url);
                setLoading(false);
            }
         } catch (error) {
            console.log("error downloading image:", error);
         }
        };
        if (filePath && filePath.length > 0) {
            downloadImage(filePath);
        } else {
            setLoading(false);
            setImage("");
        }
    }, [filePath])

    if (loading) {
        return <div className={styles.centeredFlex}>
            <Loader />
        </div>
    }

    return image ? (
        <img src={image} alt={filePath} ref={ref} onLoad={onLoad} {...props} />
    ) : null;
    }
);