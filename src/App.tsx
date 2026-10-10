import { BotStacksWidgetMount } from './components/BotStacksWidgetMount';
import { Intro } from './components/Intro';
import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';
import { Capabilities, Details } from './components/SupportingSections';

export default function App() {
  return (
    <>
      <a className="skip-link" href="#assistant">
        Skip to the assistant
      </a>

      <SiteHeader />

      <main>
        {/* The intro and the mount share one full-viewport band so the widget
            area is the dominant element on first paint. */}
        <section className="stage-section shell" id="assistant" aria-label="Sabermetrics AI assistant">
          <Intro />
          <BotStacksWidgetMount />
        </section>

        <Capabilities />
        <Details />
      </main>

      <SiteFooter />
    </>
  );
}
