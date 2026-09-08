import type { ReactNode } from 'react';
import styles from './Masthead.module.css';

interface MastheadProps {
  right: ReactNode;
}

export function Masthead({ right }: MastheadProps) {
  return (
    <>
      <div className={styles.row}>
        <div className={styles.brand}>Her&nbsp;Crown</div>
        <div className={styles.right}>{right}</div>
      </div>
      <div className={styles.ruleThick} />
      <div className={styles.ruleThin} />
    </>
  );
}
