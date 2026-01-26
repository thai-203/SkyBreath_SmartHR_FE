import { InputHTMLAttributes, forwardRef } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, fullWidth = false, className = '', ...props }, ref) => {
        return (
            <div className={`input-wrapper ${fullWidth ? 'input-full' : ''}`}>
                {label && (
                    <label className="input-label" htmlFor={props.id}>
                        {label}
                        {props.required && <span className="text-error"> *</span>}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`input ${error ? 'input-error' : ''} ${className}`}
                    {...props}
                />
                {error && <span className="input-error-message">{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
