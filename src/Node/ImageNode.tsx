import { NodeData } from "../utils/types"
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useAppState } from "../state/AppStateContext";
import cx from "classnames";
import styles from "./Node.module.css";
import { FileImage } from "../components/FileImage";
import { uploadImage } from "../utils/uploadImage";
import { Loader } from "../components/Loader";
import { supabase } from "../supabaseClient";
import { Resizable } from "re-resizable";
import "react-resizable/css/styles.css";
import { usePageId } from "../Page/PageIdContext";


type ImageNodeProps = {
    node: NodeData;
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

const updateNodeCaptionInPage = async (pageId: string, nodeId: string, newCaption: string) => {
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
            n.id === nodeId ? { ...n, caption: newCaption } : n
        );

        const { error: updateError } = await supabase
            .from("pages")
            .update({ nodes: updatedNodes })
            .eq("id", pageId);

        if (updateError) {
            console.error("Error updating node caption:", updateError);
        } else {
            console.log("Caption saved successfully!");
        }
    };



export const ImageNode = ({ node, index }: ImageNodeProps) => {
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
                setImagePath(result.filePath);
                await handleSaveCaption();
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
        setCaption("");
    }

    const handleDeleteImage = () => {
        removeNodeByIndex(index);
    };

    const handleReplaceImage = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click();
        }
    };

    const handleCaptionChange = (event: ChangeEvent<HTMLInputElement>) => {
        setCaption(event.target.value);
    };

    const toggleCaptionEdit = () => {
        setIsCaptionEditing((prev) => !prev);
        };

    const handleSaveCaption = async () => {
        await updateNodeCaptionInPage(pageId, node.id, caption);
        setIsCaptionEditing(false);
    };


    const captionInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
    if (isCaptionEditing) {
        captionInputRef.current?.focus();
    }
    }, [isCaptionEditing]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (document.activeElement?.tagName === "INPUT") return;
            event.preventDefault();
            if (event.key === "Backspace") {
                removeNodeByIndex(index);
            }
            if (event.key === "Enter") {
                fileInputRef.current?.click();
            }
        };
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [removeNodeByIndex, index])

    return (
        <div className={cx(styles.node, styles.image)}>
            {imagePath ? (
                    <>
                <div className={styles.imageAndCaption}>
                 <Resizable
                    size={{ width }}
                    enable={{
                        top: false,
                        right: true,
                        bottom: false,
                        left: true,
                        topRight: false,
                        bottomRight: false,
                        bottomLeft: false,
                        topLeft: false,
                    }}
                    maxWidth={900}
                    maxHeight={700}
                    minHeight="auto"
                    minWidth={400}
                    style={{ display: "inline-table" }}
                    onResizeStop={async (e, direction, ref, delta) => {
                        const newWidth = ref.offsetWidth;
                        const newHeight = ref.offsetHeight;
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
                        <button onClick={toggleCaptionEdit} className={styles.button}>Edit Caption</button>
                        </div>
                    </div>
                          {isCaptionEditing ? (
                            <input
                                ref={captionInputRef}
                                type="text"
                                className={styles.captionInput}
                                value={caption}
                                onChange={handleCaptionChange}
                                onBlur={async () => {
                                    updateNodeCaptionInPage(pageId, node.id, caption);
                                    setIsCaptionEditing(false);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                    (e.target as HTMLInputElement).blur();
                                    }
                                }}
                                placeholder="Add a caption..."
                            />
                        ) : (
                            <p className={styles.caption}>{caption}</p>
                        )}
                    </Resizable>
                        {loading && <Loader />}
                        </div>
                    </>
                ) : (
                    <button
                        className={styles.uploadButton}
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                    >
                        Upload Image
                    </button>
                )}
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