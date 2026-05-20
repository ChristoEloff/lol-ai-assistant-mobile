import { Component, inject, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameSessionService } from './services/game-session.service';
import { ActivePhase, EnemyPlaystyle } from './models/game-session';
import { DashboardHomeComponent } from './dashboard-home/dashboard-home.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardHomeComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  protected currentTab = signal<'game' | 'dashboard'>('game');
  protected sessionService = inject(GameSessionService);
  
  protected ActivePhase = ActivePhase;
  protected EnemyPlaystyle = EnemyPlaystyle;

  protected adviceText = signal<string>('');
  protected isGeneratingAdvice = signal<boolean>(false);

  // Dropdown / Search Autocomplete Signals
  protected userSearchQuery = signal<string>('');
  protected opponentSearchQuery = signal<string>('');
  protected showUserDropdown = signal<boolean>(false);
  protected showOpponentDropdown = signal<boolean>(false);

  // Filtered list computeds
  protected filteredUserChampions = computed(() => {
    const query = this.userSearchQuery().toLowerCase().trim();
    const all = this.sessionService.allChampions();
    if (!query) return all;
    return all.filter(c => c.toLowerCase().includes(query));
  });

  protected filteredOpponentChampions = computed(() => {
    const query = this.opponentSearchQuery().toLowerCase().trim();
    const all = this.sessionService.allChampions();
    if (!query) return all;
    return all.filter(c => c.toLowerCase().includes(query));
  });

  protected champions = [
    'Aatrox', 'Ahri', 'Akali', 'Ashe', 'Bard', 'Caitlyn', 'Darius', 'Ezreal', 
    'Garen', 'Jinx', 'Katarina', 'Lee Sin', 'Lux', 'Malphite', 'Miss Fortune', 
    'Thresh', 'Vayne', 'Yasuo', 'Yone', 'Zed'
  ];

  protected runes = [
    'Press the Attack', 'Fleet Footwork', 'Conqueror',
    'Electrocute', 'Dark Harvest', 'Hail of Blades',
    'Summon Aery', 'Arcane Comet', 'Phase Rush',
    'Grasp of the Undying', 'Aftershock', 'Guardian', 'First Strike'
  ];

  constructor() {
    effect(() => {
      const state = this.sessionService.state();
      if (state.adviceRequested && !state.adviceText) {
        this.isGeneratingAdvice.set(true);
      } else {
        this.isGeneratingAdvice.set(false);
        this.adviceText.set(state.adviceText);
      }
    });

    effect(() => {
      const state = this.sessionService.state();
      if (!this.showUserDropdown()) {
        this.userSearchQuery.set(state.userChampion);
      }
      if (!this.showOpponentDropdown()) {
        this.opponentSearchQuery.set(state.opponentChampion);
      }
    });
  }

  onUserSearchChange(query: string) {
    this.userSearchQuery.set(query);
    this.showUserDropdown.set(true);
  }

  onOpponentSearchChange(query: string) {
    this.opponentSearchQuery.set(query);
    this.showOpponentDropdown.set(true);
  }

  selectUserChampion(champion: string) {
    this.userSearchQuery.set(champion);
    this.sessionService.updateState({ userChampion: champion, adviceText: '' });
    this.showUserDropdown.set(false);
  }

  selectOpponentChampion(champion: string) {
    this.opponentSearchQuery.set(champion);
    this.sessionService.updateState({ opponentChampion: champion, adviceText: '' });
    this.showOpponentDropdown.set(false);
  }

  updateUserChampion(champion: string) {
    this.userSearchQuery.set(champion);
    this.sessionService.updateState({ userChampion: champion, adviceText: '' });
  }

  updateOpponentChampion(champion: string) {
    this.opponentSearchQuery.set(champion);
    this.sessionService.updateState({ opponentChampion: champion, adviceText: '' });
  }

  hideDropdownWithDelay(type: 'user' | 'opponent') {
    setTimeout(() => {
      if (type === 'user') {
        this.showUserDropdown.set(false);
      } else {
        this.showOpponentDropdown.set(false);
      }
    }, 200);
  }

  formatPoints(pts: number): string {
    if (pts >= 1000000) {
      return (pts / 1000000).toFixed(1) + 'm';
    }
    if (pts >= 1000) {
      return Math.round(pts / 1000) + 'k';
    }
    return pts.toString();
  }

  updateRune(rune: string) {
    this.sessionService.updateState({ selectedRunes: rune ? [rune] : [], adviceText: '' });
  }

  setPhase(phase: ActivePhase) {
    this.sessionService.updateState({ activePhase: phase, adviceText: '' });
  }

  togglePlaystyle(playstyle: EnemyPlaystyle) {
    const current = this.sessionService.state().enemyPlaystyle;
    const target = current === playstyle ? EnemyPlaystyle.Neutral : playstyle;
    this.sessionService.updateState({ enemyPlaystyle: target, adviceText: '' });
  }

  requestAdvice() {
    this.sessionService.updateState({ adviceRequested: true, adviceText: '' });
  }

  dismissAdvice() {
    this.sessionService.updateState({ adviceRequested: false, adviceText: '' });
  }
}
