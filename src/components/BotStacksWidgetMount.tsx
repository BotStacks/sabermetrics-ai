/**
 * Reserved space for the real BotStacks full-screen widget.
 *
 * This component deliberately contains no chat UI and no integration code. It
 * exists to hold layout and to expose one stable mounting point:
 *
 *   #botstacks-widget-root
 *
 * That element is absolutely positioned to the full width and height of the
 * stage, so whatever the widget renders into it can fill 100% of the area
 * without any further layout work.
 *
 * The placeholder below is a development marker. Deleting the
 * `<p className="widget-mount__placeholder">` line is the only cleanup the
 * integration needs.
 */

export const BOTSTACKS_WIDGET_ROOT_ID = 'botstacks-widget-root';

export function BotStacksWidgetMount() {
  return (
    <div className="widget-mount">
      <div id={BOTSTACKS_WIDGET_ROOT_ID} className="widget-mount__root" />
      <p className="widget-mount__placeholder">BotStacks Full-Screen Widget Mount</p>
    </div>
  );
}
