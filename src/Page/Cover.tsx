import styles from "./Cover.module.css";
import { ChangeEventHandler, useRef } from "react";

export const Cover = () => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const onChangeCoverImage = () => {
        fileInputRef.current?.click()
    }
    const onCoverImageUpload:ChangeEventHandler<HTMLInputElement> = (event) => {
        const target = event.target;
        console.log(target?.files?.[0]);
    }

    return (
        <div className={styles.cover}>
            <img src="src/Page/Cover Image.png" alt="Cover" className={styles.image}/>
            <button className={styles.button} onClick={onChangeCoverImage}>Change cover photo</button>
            <input onChange={onCoverImageUpload} style={{ display: "none" }} ref={fileInputRef} type="file" />
        </div>
    )
}