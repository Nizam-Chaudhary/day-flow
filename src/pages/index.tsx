import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
    component: HomePage,
});

function HomePage() {
    return (
        <section className='home-section'>
            <article className='status-card home-panel'>
                <h2 className='home-panel__title'>Greenfield desktop shell</h2>
                <p className='home-panel__copy'>
                    The renderer is React-only for now. Routing comes from files in{' '}
                    <code>src/pages</code>, and Electron-specific behavior stays isolated to the
                    main and preload processes.
                </p>
            </article>
            <article className='status-card home-panel'>
                <h2 className='home-panel__title'>Next logical additions</h2>
                <p className='home-panel__copy'>
                    Calendar state, integration IPC, offline persistence, and failure-aware
                    background sync can now be layered in without changing the bootstrap.
                </p>
            </article>
        </section>
    );
}
