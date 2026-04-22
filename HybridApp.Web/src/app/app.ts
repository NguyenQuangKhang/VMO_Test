import { Component, signal, NgZone } from '@angular/core';
import { ChartComponent } from './chart.component';
import * as fb from 'flatbuffers';
import { DataPacket } from './models/hybrid-app/flat-buffers/data-packet';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChartComponent],
  template: `
    <div class="dashboard dark-theme">
      <header class="header">
        <div class="logo">
          <span class="icon">₿</span>
          <h2>BTC / AGT</h2>
          <span class="price-up">+2.45%</span>
        </div>
        <div class="controls">
          <div class="control-item">
            <span class="label">Zoom Level</span>
            <select (change)="onWindowSizeChange($event)">
              <option value="100">100 pts</option>
              <option value="1000">1k pts</option>
              <option value="10000">10k pts</option>
              <option value="100000">100k pts</option>
              <option value="2000000">All (2M)</option>
            </select>
          </div>
          <div class="stat-item">
            <span class="label">Total Points</span>
            <span class="value">{{ pointCount().toLocaleString() }}</span>
          </div>
        </div>
      </header>

      <main class="content">
        <div class="chart-wrapper">
          <div class="chart-card">
            <app-chart style="position: absolute; inset: 0;" [data]="chartData" [windowSize]="currentWindowSize" [scrollOffset]="scrollOffset"></app-chart>
          </div>
          <div class="scrollbar-container">
            <input type="range" min="0" max="1" step="0.0001" [value]="scrollOffset" 
                   (input)="onScroll($event)" class="range-scroll">
          </div>
        </div>
      </main>

      <footer class="footer">
        <div class="status-indicator">
          @if (errorMessage()) {
            <span style="color: #f6465d;">{{ errorMessage() }}</span>
          } @else {
            <span class="pulse"></span>
            <span>Pure Shared Memory Mode (Zero-Copy)</span>
          }
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .dashboard { display: flex; flex-direction: column; height: 100vh; background: #0b0e11; overflow: hidden; }
    .header { flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 1.25rem; background: #181a20; border-bottom: 1px solid #2b2f36; }
    .logo { display: flex; align-items: center; gap: 0.75rem; }
    .logo .icon { color: #f3ba2f; font-size: 1.25rem; font-weight: bold; }
    .logo h2 { margin: 0; font-size: 1rem; font-weight: 600; color: #eaecef; }
    .price-up { color: #0ecb81; font-size: 0.8rem; font-weight: 500; }
    .controls { display: flex; gap: 1.5rem; align-items: center; }
    .control-item, .stat-item { display: flex; flex-direction: column; }
    .control-item select { background: #2b2f36; color: #eaecef; border: 1px solid #474d57; padding: 1px 4px; border-radius: 2px; font-size: 0.7rem; outline: none; }
    .label { color: #848e9c; font-size: 0.65rem; margin-bottom: 1px; }
    .value { font-weight: 500; color: #eaecef; font-size: 0.8rem; }
    .content { flex: 1; padding: 0.5rem; background: #0b0e11; display: flex; flex-direction: column; min-height: 0; }
    .chart-wrapper { display: flex; flex-direction: column; flex: 1; min-height: 0; gap: 0.25rem; }
    .chart-card { flex: 1; background: #161a1e; border-radius: 4px; padding: 0; min-height: 0; position: relative; overflow: hidden; border: 1px solid #2b2f36; }
    .scrollbar-container { height: 12px; flex-shrink: 0; padding: 2px 0; }
    .range-scroll { width: 100%; background: #2b2f36; height: 3px; border-radius: 1.5px; appearance: none; outline: none; margin: 0; }
    .range-scroll::-webkit-slider-thumb { appearance: none; width: 100px; height: 6px; background: #f3ba2f; border-radius: 3px; cursor: pointer; border: none; }
    .footer { flex-shrink: 0; padding: 0.2rem 1rem; background: #0b0e11; border-top: 1px solid #2b2f36; display: flex; align-items: center; justify-content: flex-end; }
    .status-indicator { display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; color: #848e9c; }
    .pulse { width: 6px; height: 6px; background: #0ecb81; border-radius: 50%; }
  `],
})
export class App {
  protected readonly pointCount = signal(0);
  protected readonly errorMessage = signal('');
  protected chartData: any = [[], []];
  protected currentWindowSize = 100;
  protected scrollOffset = 0;

  constructor(private zone: NgZone) {
    this.setupSharedBufferListener();
  }

  private setupSharedBufferListener() {
    const initListener = () => {
      const webview = (window as any).chrome?.webview;
      if (webview) {
        webview.addEventListener('sharedbufferreceived', (event: any) => {
          try {
            const data = typeof event.additionalData === 'string' 
              ? JSON.parse(event.additionalData) : event.additionalData;
            
            if (data?.type === 'DATA_SHARED_BUFFER') {
              const buffer = event.getBuffer();
              this.zone.run(() => {
                const uint8Array = new Uint8Array(buffer);
                this.decodeAndRender(uint8Array);
              });
            }
          } catch (err: any) {
            this.zone.run(() => this.errorMessage.set(`Buffer Error: ${err.message}`));
          }
        });
      } else {
        setTimeout(initListener, 100);
      }
    };
    initListener();
  }

  private decodeAndRender(uint8Array: Uint8Array) {
    const fbBuffer = new fb.ByteBuffer(uint8Array);
    const packet = DataPacket.getRootAsDataPacket(fbBuffer);
    const count = packet.dataLength();
    const y = packet.dataArray();
    if (!y) return;
    
    const x = new Float64Array(count);
    for (let i = 0; i < count; i++) { x[i] = i; }
    
    this.chartData = [x, y];
    this.pointCount.set(count);
  }

  onScroll(event: any) { this.scrollOffset = parseFloat(event.target.value); }
  onWindowSizeChange(event: any) { this.currentWindowSize = parseInt(event.target.value); }
}
