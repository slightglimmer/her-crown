import styles from './ServiceChips.module.css';

interface ServiceChipsProps {
  services: string[];
  selected: string[];
  onToggle: (service: string) => void;
}

export function ServiceChips({ services, selected, onToggle }: ServiceChipsProps) {
  return (
    <div className={styles.row}>
      {services.map((name) => {
        const on = selected.includes(name);
        return (
          <button
            key={name}
            type="button"
            className={styles.chip}
            aria-pressed={on}
            data-selected={on || undefined}
            onClick={() => onToggle(name)}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}
