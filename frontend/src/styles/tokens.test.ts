import fs from 'fs';
import path from 'path';

describe('UI token contract', () => {
  const css = fs.readFileSync(path.join(process.cwd(), 'src/styles/tokens.css'), 'utf8');

  it('defines light and dark-ready semantic variables', () => {
    expect(css).toContain(':root');
    expect(css).toContain("[data-theme='dark']");
    [
      '--ui-primary', '--ui-surface', '--ui-canvas', '--ui-foreground',
      '--ui-muted', '--ui-border', '--ui-success', '--ui-info', '--ui-warning',
      '--ui-danger', '--ui-ring', '--ui-disabled', '--font-arabic',
      '--radius-panel', '--z-dialog', '--motion-fast',
    ].forEach((token) => expect(css).toContain(token));
  });

  it('loads both approved font families with swap behavior', () => {
    const htmlPath = path.join(process.cwd(), 'index.html');
    expect(fs.existsSync(htmlPath)).toBe(true);
    const html = fs.readFileSync(htmlPath, 'utf8');
    expect(html).toContain('family=Inter');
    expect(html).toContain('family=Noto+Sans+Arabic');
    expect(html).toContain('display=swap');
  });
});
