import { Component, inject, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameSessionService } from '../services/game-session.service';
import { ActivePhase, EnemyPlaystyle } from '../models/game-session';

@Component({
  selector: 'app-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.css']
})
export class OverlayComponent {
  protected sessionService = inject(GameSessionService);
  
  protected adviceText = signal<string>('');
  protected isCalculating = signal<boolean>(false);

  constructor() {
    effect(() => {
      const state = this.sessionService.state();
      if (state.adviceRequested && !state.adviceText) {
        this.isCalculating.set(true);
      } else {
        this.isCalculating.set(false);
        this.adviceText.set(state.adviceText);
      }
    });
  }

  dismissAdvice() {
    this.sessionService.updateState({ adviceRequested: false, adviceText: '' });
  }
}
