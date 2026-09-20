import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from 'react-bootstrap';
import i18n from '../i18n';

interface ErrorBoundaryProps {
    children: ReactNode
}

interface ErrorBoundaryState {
    error: Error | null,
    componentStack: string | null
}

class ErrorBoundaryComp extends Component<ErrorBoundaryProps, ErrorBoundaryState> {

    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { error: null, componentStack: null };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { error: error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Unhandled error', error, errorInfo);
        this.setState({ componentStack: errorInfo.componentStack || null });
    }

    getDetails(): string {
        const { error, componentStack } = this.state;
        return [error?.message, error?.stack, componentStack].filter((part) => !!part).join('\n\n');
    }

    handleCopy = () => {
        navigator.clipboard.writeText(this.getDetails());
    }

    handleReload = () => {
        window.location.reload();
    }

    render() {
        if (!this.state.error) {
            return this.props.children
        }

        return (
            <div className="errorBoundary">
                <h4>{i18n.t('somethingWentWrong')}</h4>
                <p>{i18n.t('errorBoundaryInfo')}</p>
                <pre className="errorBoundaryDetails">{this.getDetails()}</pre>
                <Button variant="secondary" onClick={this.handleCopy}>{i18n.t('copyErrorDetails')}</Button>
                {' '}
                <Button variant="primary" onClick={this.handleReload}>{i18n.t('reload')}</Button>
            </div>
        )
    }
}

export default ErrorBoundaryComp;
