import { Component, ElementRef, ViewChild, inject, signal, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@shared/components/icon/icon.component';
import { LangService } from '@core/services/lang.service';
import { OcrService } from '@core/services/ocr.service';

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './scan.component.html',
  styleUrl: './scan.component.scss',
})
export class ScanComponent implements OnDestroy {
  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  protected readonly lang = inject(LangService);
  private readonly router = inject(Router);
  private readonly ocrService = inject(OcrService);

  captured = signal(false);
  flashOn = signal(false);
  private stream: MediaStream | null = null;

  async ngAfterViewInit(): Promise<void> {
    await this.startCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  private async startCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (this.videoRef?.nativeElement) {
        this.videoRef.nativeElement.srcObject = this.stream;
      }
    } catch {
      // Camera not available (desktop/permissions denied) — fall back gracefully
    }
  }

  private stopCamera(): void {
    this.stream?.getTracks().forEach(t => t.stop());
  }

  capture(): void {
    if (this.captured()) return;
    this.captured.set(true);

    const canvas = document.createElement('canvas');
    const video = this.videoRef?.nativeElement;

    if (video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
    }

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    this.ocrService.reset();

    setTimeout(() => {
      this.router.navigate(['/processing'], { state: { imageData } });
    }, 600);
  }

  openGallery(): void {
    this.fileInputRef?.nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;
      this.router.navigate(['/processing'], { state: { imageData } });
    };
    reader.readAsDataURL(file);
  }

  toggleFlash(): void {
    this.flashOn.update(v => !v);
    const track = this.stream?.getVideoTracks()[0];
    if (track) {
      (track as MediaStreamTrack & { applyConstraints: (c: object) => Promise<void> })
        .applyConstraints({ advanced: [{ torch: this.flashOn() } as object] })
        .catch(() => { /* Flash not supported */ });
    }
  }

  close(): void {
    this.router.navigate(['/home']);
  }
}
