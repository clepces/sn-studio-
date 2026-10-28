
export function initPreloader() {
  const loader = document.getElementById('global-preloader');
  const progress = document.getElementById('splash-progress');
  const percentage = document.getElementById('splash-percentage');
  const status = document.getElementById('splash-status');

  if (!loader || !progress || !percentage || !status) return;

  let p = 0;
  const interval = setInterval(() => {
    p += Math.random() * 20;
    if (p > 100) p = 100;

    progress.style.setProperty('--buca-progress', `${p}%`);
    percentage.textContent = `${Math.round(p)}%`;

    if (p >= 100) {
      clearInterval(interval);
      status.textContent = 'Sistema Listo.';
      setTimeout(() => {
        loader.style.opacity = '0';
        loader.style.visibility = 'hidden';
        document.body.style.overflow = 'auto';
        setTimeout(() => loader.remove(), 600);
      }, 300);
    } else if (p > 50) {
      status.textContent = 'Cargando módulos de interfaz...';
    }
  }, 200);
}
