import styles from "./Loader.module.css";

// https://loading.io/css/

export const Loader = () => {
	return (
		<div className={styles.loader} data-testid="loader" role="status" aria-label="Loading...">
			<div />
			<div />
			<div />
			<div />
		</div>
	);
};