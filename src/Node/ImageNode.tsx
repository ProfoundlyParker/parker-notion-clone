import { NodeData } from "../utils/types"
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useAppState } from "../state/AppStateContext";
import cx from "classnames";
import styles from "./Node.module.css";
import { FileImage } from "../components/FileImage";
import { uploadImage } from "../utils/uploadImage";
import { Loader } from "../components/Loader";


type ImageNodeProps = {
    node: NodeData;
    isFocused: boolean;
    index: number;
};

export const ImageNode = ({ node, isFocused, index }: ImageNodeProps) => {
    const { removeNodeByIndex, changeNodeValue, changeNodeType } = useAppState();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    
    const onImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const target = event.target;
        const file = target.files?.[0];

        if (!file) {
            changeNodeValue(index, "");
            return;
        }
    
        try {
            setLoading(true);
            const result = await uploadImage(file);
            if (result?.filePath) {
                changeNodeValue(index, result.filePath);
            }
        }
        catch (error) {
            changeNodeType(index, "text")
        } finally {
            setLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            event.preventDefault();
            if (event.key === "Backspace") {
                removeNodeByIndex(index);
            }
            if (event.key === "Enter") {
                fileInputRef.current?.click();
            }
        };
        if (isFocused) {
            window.addEventListener("keydown", handleKeyDown);
        } else {
            window.removeEventListener("keydown", handleKeyDown);
        }
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isFocused, removeNodeByIndex, index])

    return (
        <div className={cx(styles.node, styles.image, {
            [styles.focused]: isFocused
        })}>
            <>
                <FileImage filePath={node.value} />
                <input type="file" ref={fileInputRef} onChange={onImageUpload} accept="image/*" />
                {loading && <Loader />}
            </>
        </div>
    )
}


// type ImageNodeProps = {
//     node: NodeData;
//     isFocused: boolean;
//     index: number;
// }

// export const ImageNode = ({ node, isFocused, index }: ImageNodeProps) => {
//     const { removeNodeByIndex, changeNodeValue, changeNodeType } = useAppState();
//     const fileInputRef = useRef<HTMLInputElement>(null);
    
//     useEffect(() => {
//         if ((!node.value || node.value.length === 0) && !fileInputRef.current?.value) {
//             fileInputRef.current?.click();
//         } 
//     }, [node.value])

//     useEffect(() => {
//         const handleKeyDown = (event: KeyboardEvent) => {
//             event.preventDefault();
//             if (event.key === "Backspace") {
//                 removeNodeByIndex(index);
//             }
//             if (event.key === "Enter") {
//                 fileInputRef.current?.click();
//             }
//         };
//         if (isFocused) {
//             window.addEventListener("keydown", handleKeyDown);
//         } else {
//             window.removeEventListener("keydown", handleKeyDown);
//         }
        
//         return () => {
//             window.removeEventListener("keydown", handleKeyDown);
//         };
//     }, [isFocused, removeNodeByIndex, index, node])

//     const onImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
//         const target = event.target;
//         const file = target.files?.[0];

//         if (!file) {
//             changeNodeValue(index, "");
//             return;
//         }
    
//         try {
//             const result = await uploadImage(file);
//             if (result?.filePath) {
//                 changeNodeValue(index, result.filePath);
//             }
//         }
//         catch (error) {
//             changeNodeType(index, "text")
//         } finally {
//             if (fileInputRef.current) {
//                 fileInputRef.current.value = "";
//             }
//         }
//     }

//     return (
//         <div className={cx(styles.node, styles.image, {
//             [styles.focused]: isFocused
//         })}>
//             <>
//                 <FileImage filePath={node.value} />
//                 <input type="file" ref={fileInputRef} onChange={onImageUpload} style={{ display: "none" }} accept="image/*" />
//             </>
//         </div>
//     )
// }