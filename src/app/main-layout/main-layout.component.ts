import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { GameSessionService } from '../services/game-session.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-container animate-fade">
      <!-- Glowing Background Orbs -->
      <div class="bg-glow-orb orb-top-left"></div>
      <div class="bg-glow-orb orb-bottom-right"></div>

      <!-- Header Section -->
      <header class="app-header">
        <div class="header-left">
          <span class="logo-icon">▲</span>
          <div class="brand">
            <h1>LOL AI ASSISTANT</h1>
            <span class="subtitle">TACTICAL COORDINATION DECK</span>
          </div>
          
          <nav class="header-nav">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">Tactical Deck</a>
            <a routerLink="/home" routerLinkActive="active" class="nav-link">Stats & Meta</a>
          </nav>
        </div>

        <div class="header-right">
          <div class="connection-status" [class.connected]="sessionService.isConnected()" [class.reconnecting]="sessionService.isReconnecting()">
            <span class="status-dot"></span>
            <span class="status-text">
              @if (sessionService.isConnected()) {
                CORE API CONNECTED
              } @else if (sessionService.isReconnecting()) {
                RE-ESTABLISHING HOST CONNECTION...
              } @else {
                OFFLINE (PORT 8080)
              }
            </span>
          </div>
        </div>
      </header>

      <!-- Child Views Rendered Here -->
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrls: ['../dashboard/dashboard.component.css']
})
export class MainLayoutComponent {
  protected sessionService = inject(GameSessionService);
}
