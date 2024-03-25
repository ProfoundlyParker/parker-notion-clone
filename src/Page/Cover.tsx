import { FileImage } from "../components/FileImage";
import { uploadImage } from "../utils/uploadImage";
import styles from "./Cover.module.css";
import { ChangeEventHandler, useRef } from "react";

type CoverProps = {
    filePath?: string;
    changePageCover: (filePath: string) =>  void;
}

export const Cover = ({ filePath, changePageCover }: CoverProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const onChangeCoverImage = () => {
        fileInputRef.current?.click()
    }
    const onCoverImageUpload: ChangeEventHandler<HTMLInputElement> = async (event) => {
        const target = event.target;
        const result = await uploadImage(target?.files?.[0])

        if (result?.filePath) {
            changePageCover(result.filePath);
        }
    }

    return (
        <div className={styles.cover}>
            {
                filePath ? (
                    <FileImage className={styles.image} filePath={filePath} />
                ) : (
                    <img src="src/Page/Cover Image.png" alt="Cover" className={styles.image}/>
                )
            }
            <button className={styles.button} onClick={onChangeCoverImage}>Change cover photo</button>
            <input onChange={onCoverImageUpload} style={{ display: "none" }} ref={fileInputRef} type="file" />
        </div>
    )
}