import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import uPlot from 'uplot';

@Component({
  selector: 'app-chart',
  standalone: true,
  template: `
    <div #chartContainer style="position: absolute; inset: 0;">
      <div #tooltip class="u-tooltip" style="display: none; position: absolute; z-index: 100; pointer-events: none; background: rgba(24, 26, 32, 0.9); border: 1px solid #474d57; padding: 8px 12px; border-radius: 4px; color: #eaecef; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
        <div style="color: #848e9c; margin-bottom: 4px; font-weight: bold;">Bitcoin (BTC)</div>
        <div style="display: flex; justify-content: space-between; gap: 20px;">
          <span>Price:</span>
          <span #tooltipValue style="color: #0ecb81; font-weight: 600;">$0.00</span>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 20px; margin-top: 2px;">
          <span>Time:</span>
          <span #tooltipTime style="color: #eaecef;">0</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; background: #161a1e; overflow: hidden; position: relative; }
  `]
})
export class ChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  @ViewChild('tooltip', { static: true }) tooltip!: ElementRef;
  @ViewChild('tooltipValue', { static: true }) tooltipValue!: ElementRef;
  @ViewChild('tooltipTime', { static: true }) tooltipTime!: ElementRef;
  
  @Input() data: any = [[], []];
  @Input() windowSize: number = 100;
  @Input() scrollOffset: number = 0;

  private uplot?: uPlot;
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit() {
    this.setupResizeObserver();
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.uplot?.destroy();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.uplot) {
      if (changes['data']) {
        this.uplot.setData(this.data);
      }
      this.updateScale();
    }
  }

  private updateScale() {
    if (!this.uplot || !this.data[0].length) return;
    const totalPoints = this.data[0].length;
    const actualWindow = Math.min(this.windowSize, totalPoints);
    const maxStart = totalPoints - actualWindow;
    const startIdx = Math.floor(this.scrollOffset * maxStart);
    const endIdx = startIdx + actualWindow;

    const minX = this.data[0][startIdx];
    const maxX = this.data[0][endIdx - 1];
    this.uplot.setScale("x", { min: minX, max: maxX });
  }

  private setupResizeObserver() {
    this.resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 50 && height > 50) {
          if (!this.uplot) {
            this.initChart(width, height);
          } else {
            this.uplot.setSize({ width, height });
          }
        }
      }
    });
    this.resizeObserver.observe(this.chartContainer.nativeElement);
  }

  private initChart(width: number, height: number) {
    const tooltipEl = this.tooltip.nativeElement;
    const valEl = this.tooltipValue.nativeElement;
    const timeEl = this.tooltipTime.nativeElement;

    const opts: uPlot.Options = {
      width: width,
      height: height,
      cursor: {
        show: true,
        dataIdx: (u, seriesIdx, closestIdx) => closestIdx,
      },
      hooks: {
        setCursor: [
          u => {
            const { idx } = u.cursor;
            if (idx != null) {
              const x = u.data[0][idx];
              const y = u.data[1][idx];
              const left = u.valToPos(x, 'x');
              const top = u.valToPos(y as number, 'y');
              
              timeEl.textContent = x.toString();
              valEl.textContent = `$${(y as number).toFixed(2)}`;
              tooltipEl.style.display = "block";
              tooltipEl.style.left = (left + 20) + "px";
              tooltipEl.style.top = (top + 20) + "px";
              if (left + 150 > u.bbox.width) tooltipEl.style.left = (left - 160) + "px";
            } else {
              tooltipEl.style.display = "none";
            }
          }
        ]
      },
      scales: { x: { time: false }, y: { auto: true } },
      series: [
        { label: "Time", stroke: "#848e9c" },
        { label: "Price", stroke: "#f3ba2f", width: 2, points: { show: false } }
      ],
      axes: [
        { stroke: "#848e9c", grid: { stroke: "#2b2f36" }, space: 100, font: "10px sans-serif" },
        { stroke: "#848e9c", grid: { stroke: "#2b2f36" }, space: 50, font: "10px sans-serif" }
      ],
      legend: { show: false },
      padding: [12, 12, 0, 12]
    };

    this.uplot = new uPlot(opts, this.data, this.chartContainer.nativeElement);
    this.updateScale();
  }
}
