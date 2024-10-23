import { NodeData } from "../utils/types"
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useAppState } from "../state/AppStateContext";
import cx from "classnames";
import styles from "./Node.module.css";
import { FileImage } from "../components/FileImage";
import { uploadImage } from "../utils/uploadImage";
import { Loader } from "../components/Loader";
import { supabase } from "../supabaseClient";


type ImageNodeProps = {
    node: NodeData;
    isFocused: boolean;
    index: number;
};

const updateNodeCaptionInDatabase = async (nodeId: string, caption: string) => {
    const idNumber = Number(nodeId);

    const { data, error } = await supabase
        .from("nodes")
        .update({ caption })
        .eq("id", idNumber);

    if (error) {
        console.error("Error updating caption:", error);
    } else {
        console.log("Caption updated successfully:", data);
    }
};


export const ImageNode = ({ node, isFocused, index }: ImageNodeProps) => {
    const { removeNodeByIndex, changeNodeValue, changeNodeType } = useAppState();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [imagePath, setImagePath] = useState(node.value);
    const [caption, setCaption] = useState(node.caption || ""); // Assuming node has a caption field
    const [isCaptionEditing, setIsCaptionEditing] = useState(false);
    
    const onImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const target = event.target;
        const file = target.files?.[0];

        if (!file) {
            changeNodeValue(index, "");
            setImagePath("");
            return;
        }
    
        try {
            setLoading(true);
            const result = await uploadImage(file);
            if (result?.filePath) {
                changeNodeValue(index, result.filePath);
                await handleSaveCaption();
                setImagePath(result.filePath);
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

    const handleDeleteImage = () => {
        removeNodeByIndex(index);
    };

    const handleReplaceImage = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleCaptionChange = (event: ChangeEvent<HTMLInputElement>) => {
        setCaption(event.target.value);
    };

    const toggleCaptionEdit = async () => {
        if (isCaptionEditing) {
            // Save caption if currently editing
            await updateNodeCaptionInDatabase(node.id, caption);
        }
        setIsCaptionEditing(!isCaptionEditing);
    };

    const handleSaveCaption = async () => {
        const nodeIdNumber = Number(node.id);

        if (isNaN(nodeIdNumber)) {
            console.error("Invalid node ID:", node.id);
            return;
        }
    
        await updateNodeCaptionInDatabase(nodeIdNumber, caption);
        setIsCaptionEditing(false);
    };

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
            <div className={styles.imageContainer}>
            {imagePath ? (
                    <>
                        <FileImage filePath={imagePath} />
                        <div className={styles.buttonContainer}>
                            <button onClick={handleDeleteImage} className={styles.button}>Delete</button>
                            <button onClick={handleReplaceImage} className={styles.button}>Replace</button>
                            <button onClick={toggleCaptionEdit} className={styles.button}>
                                {isCaptionEditing ? "Save" : "Edit Caption"}
                            </button>
                        </div>
                        {loading && <Loader />}
                        {isCaptionEditing ? (
                            <input
                                type="text"
                                value={caption}
                                onChange={handleCaptionChange}
                                className={styles.captionInput}
                            />
                        ) : (
                            <p className={styles.caption}>{caption}</p>
                        )}
                    </>
                ) : (
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={onImageUpload}
                        accept="image/*"
                    />
                )}
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={onImageUpload}
                accept="image/*"
                style={{ display: "none" }}
            />
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