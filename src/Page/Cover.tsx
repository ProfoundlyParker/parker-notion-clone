import { FileImage } from "../components/FileImage";
import { supabase } from "../supabaseClient";
import { uploadImage } from "../utils/uploadImage";
import styles from "./Cover.module.css";
import { ChangeEventHandler, useEffect, useRef, useState } from "react";

type CoverProps = {
    filePath?: string;
    changePageCover: (filePath: string) =>  void;
    pageId?: number;
}

export const Cover = ({ filePath, changePageCover, pageId }: CoverProps) => {
    const [offsetY, setOffsetY] = useState(0);
	const [tempOffsetY, setTempOffsetY] = useState(0);
	const [isRepositioning, setIsRepositioning] = useState(false);
    const [dragging, setDragging] = useState(false);
    const startYRef = useRef<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [imageHeight, setImageHeight] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
    const getUser = async () => {
        const { data, error } = await supabase.auth.getUser();
        if (data?.user?.id) {
        setUserId(data.user.id);
        } else {
        console.error("User not found:", error);
        }
    };
    getUser();
    }, []);

    const onMouseDown = (e: React.MouseEvent) => {
		if (!isRepositioning) return;
        e.preventDefault();
        setDragging(true);
		startYRef.current = e.clientY;
	};

    const onMouseMove = (e: MouseEvent) => {
        if (!dragging || startYRef.current === null) return;

        const deltaY = e.clientY - startYRef.current;
        startYRef.current = e.clientY;

       setTempOffsetY((prev) => {
            const tentative = prev + deltaY;

            const minOffset = Math.min(0, containerHeight - imageHeight); // allow full top
            const maxOffset = 0; // don't let image go down further than container top

            return Math.max(minOffset, Math.min(tentative, maxOffset));
        });

    };

	const onMouseUp = () => {
        if (imageHeight > containerHeight) {
            const minOffset = containerHeight - imageHeight;
            const maxOffset = 0;
    
            if (tempOffsetY > maxOffset) {
                setTempOffsetY(maxOffset);
            } else if (tempOffsetY < minOffset) {
                setTempOffsetY(minOffset);
            }
        } else {
            setTempOffsetY(0);
        }
		setDragging(false);
		startYRef.current = null;
        document.body.style.userSelect = "auto";
	};

    useEffect(() => {
        if (dragging) {
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
            document.body.style.userSelect = "none"; // Disable text selection while dragging
        } else {
            document.body.style.userSelect = "auto"; // Re-enable text selection
        }
    
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            document.body.style.userSelect = "auto";
        };
    }, [dragging]);    

    useEffect(() => {
        if (!pageId || !userId) return;
        const loadOffset = async () => {
            const { data, error } = await supabase
                .from("pages")
                .select("cover_offset_y")
                .eq("id", pageId)
                .eq("created_by", userId)
                .single();
    
            if (error) {
                console.error("Failed to load cover offset:", error);
            } else if (data) {
                setOffsetY(data.cover_offset_y ?? 0);
            }
        };
    
        loadOffset();
    }, [pageId, userId]);    

    const onImageLoad = () => {
        if (imageRef.current && containerRef.current) {
            const imgHeight = imageRef.current.offsetHeight;
            const contHeight = containerRef.current.offsetHeight;
            setImageHeight(imgHeight);
            setContainerHeight(contHeight);
        }
    };    

	const imageStyle = {
		transform: `translateY(${isRepositioning ? tempOffsetY : offsetY}px)`,
		cursor: isRepositioning ? (dragging ? "grabbing" : "grab") : "default",
		userSelect: isRepositioning ? "none" : "auto",
    };

    const onChangeCoverImage = () => {
        fileInputRef.current?.click()
    }
    const onCoverImageUpload: ChangeEventHandler<HTMLInputElement> = async (event) => {
        const target = event.target;
        const file = target?.files?.[0];

        try {
            if (file) {
                const result = await uploadImage(file);
                changePageCover(result.filePath);
                setOffsetY(0);
                await supabase
				.from("pages")
				.update({ cover: result.filePath, cover_offset_y: 0 })
				.eq("id", pageId)
                .eq("created_by", userId);
            }
        } catch (error) {
            console.log("Error uploading cover image:", error)
        }
    }

   const startReposition = () => {
        if (!imageRef.current || !containerRef.current) return;
        setImageHeight(imageRef.current.offsetHeight);
        setContainerHeight(containerRef.current.offsetHeight);

        setTempOffsetY(offsetY);
        setIsRepositioning(true);
    };


	const cancelReposition = () => {
		setIsRepositioning(false);
	};

    const saveReposition = async () => {
        let clamped = tempOffsetY;
        const minOffset = Math.min(0, containerHeight - imageHeight);
        clamped = Math.max(minOffset, Math.min(clamped, 0));

    
        setOffsetY(clamped);
        setTempOffsetY(clamped);
        setIsRepositioning(false);
    
        const { error } = await supabase
            .from("pages")
            .update({ cover_offset_y: clamped })
            .eq("id", pageId)
            .eq("created_by", userId);
    
        if (error) {
            console.error("Failed to save cover offset:", error);
        }
    };    

    useEffect(() => {
        if (imageRef.current && containerRef.current) {
            setImageHeight(imageRef.current.offsetHeight);
            setContainerHeight(containerRef.current.offsetHeight);
        }
    }, [filePath]);


    return (
        <div className={styles.cover} ref={containerRef}>
            {
                filePath ? (
                    <FileImage className={styles.image} filePath={filePath} style={imageStyle} onMouseDown={onMouseDown} draggable={false} ref={imageRef} onLoad={onImageLoad} />
                ) : (
                    <img src="./src/Page/Cover Image.png" alt="Cover" className={styles.image} style={imageStyle} onMouseDown={onMouseDown} draggable={false} ref={imageRef} />
                )
            }
            {!isRepositioning &&
				<button className={styles.repositionButton} onClick={startReposition}>
					Reposition
				</button>
			}
			{isRepositioning && (
				<div className={styles.repositionControls}>
					<button onClick={saveReposition}>Save</button>
					<button onClick={cancelReposition}>Cancel</button>
				</div>
			)}
            <button className={styles.button} onClick={onChangeCoverImage}>Change cover photo</button>
            <input onChange={onCoverImageUpload} style={{ display: "none" }} ref={fileInputRef} type="file" />
        </div>
    )
}