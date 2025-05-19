import { NodeData } from "../utils/types"
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useAppState } from "../state/AppStateContext";
import cx from "classnames";
import styles from "./Node.module.css";
import { FileImage } from "../components/FileImage";
import { uploadImage } from "../utils/uploadImage";
import { Loader } from "../components/Loader";
import { supabase } from "../supabaseClient";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import { usePageId } from "../Page/PageIdContext";


type ImageNodeProps = {
    node: NodeData;
    isFocused: boolean;
    index: number;
};

const updateNodeSizeInPage = async (pageId: string, nodeId: string, newWidth: number, newHeight: number) => {
    const { data, error } = await supabase
        .from("pages")
        .select("nodes")
        .eq("id", pageId)
        .single();

    if (error || !data) {
        console.error("Error fetching page nodes:", error);
        return;
    }

    const nodes: NodeData[] = data.nodes;

    const updatedNodes = nodes.map((n) =>
        n.id === nodeId ? { ...n, width: newWidth, height: newHeight } : n
    );

    const { error: updateError } = await supabase
        .from("pages")
        .update({ nodes: updatedNodes })
        .eq("id", pageId);

    if (updateError) {
        console.error("Error updating node size:", updateError);
    }
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
    const pageId = usePageId();
    const { removeNodeByIndex, changeNodeValue, changeNodeType } = useAppState();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [imagePath, setImagePath] = useState(node.value);
    const [width, setWidth] = useState(node.width || 300);
    const [height, setHeight] = useState(node.height || 200);
    const [caption, setCaption] = useState(node.caption || "");
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
                 <ResizableBox
                    width={width}
                    height={height}
                    lockAspectRatio
                    resizeHandles={["w", "e"]}
                    minConstraints={[100, 100]}
                    maxConstraints={[1000, 800]}
                    onResizeStop={async (e, data) => {
                        const newWidth = data.size.width;
                        const newHeight = data.size.height;
                        setWidth(newWidth);
                        setHeight(newHeight);
                        await updateNodeSizeInPage(pageId, node.id, newWidth, newHeight);
                    }}
                    >
                    <div className={styles.imageWrapper}>
                        <FileImage
                        filePath={imagePath}
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                        <div className={styles.buttonContainer}>
                        <button onClick={handleDeleteImage} className={styles.button}>Delete</button>
                        <button onClick={handleReplaceImage} className={styles.button}>Replace</button>
                        <button onClick={toggleCaptionEdit} className={styles.button}>
                            {isCaptionEditing ? "Save" : "Edit Caption"}
                        </button>
                        </div>
                    </div>
                    </ResizableBox>
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