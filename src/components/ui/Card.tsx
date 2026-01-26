import { ReactNode } from 'react';
import './Card.css';

interface CardProps {
    children: ReactNode;
    title?: string;
    className?: string;
    padding?: 'sm' | 'md' | 'lg';
}

export default function Card({ children, title, className = '', padding = 'md' }: CardProps) {
    return (
        <div className={`card card-${padding} ${className}`}>
            {title && <h3 className="card-title">{title}</h3>}
            <div className="card-content">{children}</div>
        </div>
    );
}
