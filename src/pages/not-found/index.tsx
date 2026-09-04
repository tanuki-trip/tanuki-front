import { Link } from "react-router-dom";

import styles from "./style.module.css";

export function NotFoundPage() {
    return (
        <main className={styles.page}>
            <div className={styles.content}>
                <p className={styles.code}>404</p>
                <h1 className={styles.title}>페이지를 찾을 수 없습니다.</h1>
                <Link className={styles.link} to="/">
                    홈으로
                </Link>
            </div>
        </main>
    );
}
