import { Outlet, createRootRoute } from '@tanstack/react-router';

export const Route = createRootRoute({
    component: RootLayout,
});

function RootLayout() {
    const { platform, versions } = window.electronApp;

    return (
        <main className='app-shell'>
            <div className='app-shell__inner'>
                <section className='hero-card'>
                    <p className='hero-card__eyebrow'>Day Flow</p>
                    <h1 className='hero-card__title'>Plan the day before it plans you.</h1>
                    <p className='hero-card__subtitle'>
                        A lean Electron bootstrap with a secure preload bridge, file-based TanStack
                        routing, and room for the planner itself to grow without rewriting the
                        foundations.
                    </p>
                </section>

                <section className='status-grid' aria-label='Runtime information'>
                    <article className='status-card'>
                        <p className='status-card__label'>Platform</p>
                        <p className='status-card__value'>{platform}</p>
                    </article>
                    <article className='status-card'>
                        <p className='status-card__label'>Electron</p>
                        <p className='status-card__value'>{versions.electron}</p>
                    </article>
                    <article className='status-card'>
                        <p className='status-card__label'>Chrome</p>
                        <p className='status-card__value'>{versions.chrome}</p>
                    </article>
                    <article className='status-card'>
                        <p className='status-card__label'>Node</p>
                        <p className='status-card__value'>{versions.node}</p>
                    </article>
                </section>

                <Outlet />
            </div>
        </main>
    );
}
