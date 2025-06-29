import styles from "./Spacer.module.css";

type SpacerProps = {
    handleClick(): void;
    showHint: boolean;
}

export const Spacer = ({ handleClick, showHint }: SpacerProps) => {
    return (
        <div className={styles.spacer} onClick={handleClick} data-testid="spacer">
            {showHint && "Click to create first paragraph"}
        </div>
    )
}