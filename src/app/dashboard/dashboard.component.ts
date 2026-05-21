import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameSessionService } from '../services/game-session.service';
import { ActivePhase, EnemyPlaystyle } from '../models/game-session';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  protected sessionService = inject(GameSessionService);
  
  protected ActivePhase = ActivePhase;
  protected EnemyPlaystyle = EnemyPlaystyle;

  protected newRuneName = '';

  // Dropdown / Search Autocomplete Signals
  protected userSearchQuery = signal<string>('');
  protected opponentSearchQuery = signal<string>('');
  protected showUserDropdown = signal<boolean>(false);
  protected showOpponentDropdown = signal<boolean>(false);

  // Filtered List computeds
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

  protected popularRunes = [
    'Press the Attack', 'Fleet Footwork', 'Conqueror',
    'Electrocute', 'Dark Harvest', 'Hail of Blades',
    'Summon Aery', 'Arcane Comet', 'Phase Rush',
    'Grasp of the Undying', 'Aftershock', 'Guardian', 'First Strike'
  ];

  constructor() {
    // Reactively sync inputs from state when not actively searching/typing
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
    this.sessionService.updateState({ userChampion: champion });
    this.showUserDropdown.set(false);
  }

  selectOpponentChampion(champion: string) {
    this.opponentSearchQuery.set(champion);
    this.sessionService.updateState({ opponentChampion: champion });
    this.showOpponentDropdown.set(false);
  }

  updateUserChampion(champion: string) {
    this.userSearchQuery.set(champion);
    this.sessionService.updateState({ userChampion: champion });
  }

  updateOpponentChampion(champion: string) {
    this.opponentSearchQuery.set(champion);
    this.sessionService.updateState({ opponentChampion: champion });
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

  setPhase(phase: ActivePhase) {
    this.sessionService.updateState({ activePhase: phase });
  }

  setPlaystyle(playstyle: EnemyPlaystyle) {
    this.sessionService.updateState({ enemyPlaystyle: playstyle });
  }

  addRune() {
    const rune = this.newRuneName.trim();
    if (rune) {
      const currentRunes = this.sessionService.state().selectedRunes;
      if (!currentRunes.includes(rune)) {
        this.sessionService.updateState({
          selectedRunes: [...currentRunes, rune]
        });
      }
      this.newRuneName = '';
    }
  }

  removeRune(runeToRemove: string) {
    const currentRunes = this.sessionService.state().selectedRunes;
    this.sessionService.updateState({
      selectedRunes: currentRunes.filter(r => r !== runeToRemove)
    });
  }

  selectPopularRune(rune: string) {
    const currentRunes = this.sessionService.state().selectedRunes;
    if (!currentRunes.includes(rune)) {
      this.sessionService.updateState({
        selectedRunes: [...currentRunes, rune]
      });
    }
  }
}
