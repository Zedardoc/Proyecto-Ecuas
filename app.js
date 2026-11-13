// Referencias a elementos del DOM
const inputs = {
  pmax: document.getElementById('pmax'),
  demand: document.getElementById('demand'),
  k: document.getElementById('k'),
  m: document.getElementById('m'),
  i0: document.getElementById('i0'),
  tmax: document.getElementById('tmax')
};

const labels = {
  pmax: document.getElementById('val-pmax'),
  demand: document.getElementById('val-demand'),
  k: document.getElementById('val-k'),
  m: document.getElementById('val-m'),
  i0: document.getElementById('val-i0'),
  tmax: document.getElementById('val-tmax')
};

let chartE = null;
let chartI = null;

// Solución analítica exacta de las ecuaciones (3.2) y (3.3)
function solveModel(Pmax, D, k, m, I0, tmax) {
  const steps = 100;
  const dt = tmax / steps;
  const tArr = [];
  const eArr = [];
  const iArr = [];
  const thresholdArr = [];

  const km = k + m;
  const Estar = km > 0 ? m / km : 1;
  const effThreshold = D / Pmax;

  for (let s = 0; s <= steps; s++) {
    const t = s * dt;
    let E, I;

    if (km === 0) {
      E = 1;
      I = I0 + (Pmax - D) * t;
    } else {
      E = Estar + (1 - Estar) * Math.exp(-km * t);
      I = I0 + (Pmax * Estar - D) * t + (Pmax * (1 - Estar) / km) * (1 - Math.exp(-km * t));
    }

    tArr.push(Number(t.toFixed(2)));
    eArr.push(Number(E.toFixed(4)));
    iArr.push(Number(I.toFixed(2)));
    thresholdArr.push(Number(effThreshold.toFixed(4)));
  }

  return { tArr, eArr, iArr, thresholdArr, Estar, effThreshold };
}

function updateDashboard() {
  const Pmax = parseFloat(inputs.pmax.value);
  const D = parseFloat(inputs.demand.value);
  const k = parseFloat(inputs.k.value);
  const m = parseFloat(inputs.m.value);
  const I0 = parseFloat(inputs.i0.value);
  const tmax = parseFloat(inputs.tmax.value);

  // Actualizar etiquetas numéricas
  labels.pmax.textContent = Pmax;
  labels.demand.textContent = D;
  labels.k.textContent = k.toFixed(3);
  labels.m.textContent = m.toFixed(3);
  labels.i0.textContent = I0;
  labels.tmax.textContent = tmax;

  const { tArr, eArr, iArr, thresholdArr, Estar, effThreshold } = solveModel(Pmax, D, k, m, I0, tmax);

  // Cálculos críticos
  const mMin = Pmax > D ? (k * D) / (Pmax - D) : Infinity;
  const Pstar = Pmax * Estar;

  // Cálculo de t* (cuello de botella: momento en que Pmax * E(t) = D)
  let tStarText = "Nunca";
  let tStarVal = null;
  if (D >= Pmax) {
    tStarText = "0.00 días";
    tStarVal = 0;
  } else if (Pstar < D) {
    // Estar + (1 - Estar)e^(-(k+m)t) = D/Pmax
    const ratio = (effThreshold - Estar) / (1 - Estar);
    if (ratio > 0 && (k + m) > 0) {
      tStarVal = -Math.log(ratio) / (k + m);
      tStarText = `${tStarVal.toFixed(2)} días`;
    }
  }

  const iFinal = iArr[iArr.length - 1];

  // Actualizar KPIs
  document.getElementById('kpi-mmin').textContent = isFinite(mMin) ? mMin.toFixed(3) : "Inviable (D ≥ Pmáx)";
  document.getElementById('kpi-estar').textContent = `${(Estar * 100).toFixed(1)}%`;
  document.getElementById('kpi-pstar').textContent = Pstar.toFixed(1);
  document.getElementById('kpi-tstar').textContent = tStarText;
  document.getElementById('kpi-ifinal').textContent = `${iFinal.toFixed(1)} u`;

  // Sistema de alertas de mantenimiento (Rol Ing. de Sistemas)
  const alertBox = document.getElementById('alert-box');
  if (D >= Pmax) {
    alertBox.className = 'alert danger';
    alertBox.innerHTML = `<strong>Alerta Crítica:</strong> La demanda (${D} u/día) supera o iguala la capacidad máxima nueva (${Pmax} u/día). El sistema es insostenible.`;
  } else if (m < mMin) {
    alertBox.className = 'alert danger';
    alertBox.innerHTML = `<strong>Alerta de Cuello de Botella:</strong> La tasa de mantenimiento actual (m = ${m.toFixed(3)}) es menor a m<sub>mín</sub> (${mMin.toFixed(3)}). La producción cae bajo la demanda a los <strong>${tStarText}</strong>.`;
  } else if (m < mMin * 1.15) {
    alertBox.className = 'alert warn';
    alertBox.innerHTML = `<strong>Advertencia Preventiva:</strong> Producción estacionaria (${Pstar.toFixed(1)} u/día) muy cercana a la demanda (${D} u/día). Margen de seguridad bajo.`;
  } else {
    alertBox.className = 'alert ok';
    alertBox.innerHTML = `<strong>Operación Sostenible:</strong> La tasa de mantenimiento (m = ${m.toFixed(3)} ≥ ${mMin.toFixed(3)}) garantiza una producción estacionaria de ${Pstar.toFixed(1)} u/día superior a la demanda.`;
  }

  renderCharts(tArr, eArr, iArr, thresholdArr);
  renderTable(Pmax, D, k, m, I0, tmax);
}

function renderCharts(tArr, eArr, iArr, thresholdArr) {
  const ctxE = document.getElementById('chartE').getContext('2d');
  const ctxI = document.getElementById('chartI').getContext('2d');

  if (chartE) chartE.destroy();
  if (chartI) chartI.destroy();

  chartE = new Chart(ctxE, {
    type: 'line',
    data: {
      labels: tArr,
      datasets: [
        {
          label: 'Eficiencia E(t)',
          data: eArr,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          borderWidth: 2.5,
          pointRadius: 0,
          fill: true
        },
        {
          label: 'Umbral mínimo (D / Pmáx)',
          data: thresholdArr,
          borderColor: '#ef4444',
          borderDash: [6, 6],
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { title: { display: true, text: 'Tiempo t (días)', color: '#94a3b8' }, ticks: { color: '#94a3b8', maxTicksLimit: 8 } },
        y: { min: 0, max: 1.05, title: { display: true, text: 'Eficiencia', color: '#94a3b8' }, ticks: { color: '#94a3b8' } }
      },
      plugins: { legend: { labels: { color: '#e2e8f0' } } }
    }
  });

  chartI = new Chart(ctxI, {
    type: 'line',
    data: {
      labels: tArr,
      datasets: [
        {
          label: 'Inventario I(t) (unidades)',
          data: iArr,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          borderWidth: 2.5,
          pointRadius: 0,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { title: { display: true, text: 'Tiempo t (días)', color: '#94a3b8' }, ticks: { color: '#94a3b8', maxTicksLimit: 8 } },
        y: { title: { display: true, text: 'Inventario (u)', color: '#94a3b8' }, ticks: { color: '#94a3b8' } }
      },
      plugins: { legend: { labels: { color: '#e2e8f0' } } }
    }
  });
}

function renderTable(Pmax, D, k, m, I0, tmax) {
  const tbody = document.querySelector('#results-table tbody');
  tbody.innerHTML = '';

  const km = k + m;
  const Estar = km > 0 ? m / km : 1;
  const step = Math.max(1, Math.floor(tmax / 8));

  for (let t = 0; t <= tmax; t += step) {
    const E = km === 0 ? 1 : Estar + (1 - Estar) * Math.exp(-km * t);
    const I = km === 0
      ? I0 + (Pmax - D) * t
      : I0 + (Pmax * Estar - D) * t + (Pmax * (1 - Estar) / km) * (1 - Math.exp(-km * t));
    const Peff = Pmax * E;

    let status = 'Óptimo';
    if (I < 0) status = 'Déficit acumulado';
    else if (Peff < D) status = 'Cuello de botella';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t}</td>
      <td>${E.toFixed(3)}</td>
      <td>${Peff.toFixed(1)} u/día</td>
      <td>${I.toFixed(1)}</td>
      <td>${status}</td>
    `;
    tbody.appendChild(tr);
  }
}

// Eventos de sliders
Object.values(inputs).forEach(input => {
  input.addEventListener('input', updateDashboard);
});

// Botones preestablecidos
document.getElementById('btn-no-maint').addEventListener('click', () => {
  inputs.pmax.value = 100;
  inputs.demand.value = 70;
  inputs.k.value = 0.05;
  inputs.m.value = 0;
  inputs.i0.value = 200;
  inputs.tmax.value = 40;
  updateDashboard();
});

document.getElementById('btn-default').addEventListener('click', () => {
  inputs.pmax.value = 100;
  inputs.demand.value = 70;
  inputs.k.value = 0.05;
  inputs.m.value = 0.12;
  inputs.i0.value = 200;
  inputs.tmax.value = 40;
  updateDashboard();
});

// Inicializar
updateDashboard();
