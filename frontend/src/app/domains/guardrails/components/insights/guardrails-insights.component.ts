import { Component, OnInit } from '@angular/core';
import { GuardrailsService, GuardrailLog } from '../../../../core/services/guardrails.service';

@Component({
  selector: 'app-guardrails-insights',
  templateUrl: './guardrails-insights.component.html',
  styleUrls: ['./guardrails-insights.component.css']
})
export class GuardrailsInsightsComponent implements OnInit {
  logs: GuardrailLog[] = [];

  constructor(private guardrailsService: GuardrailsService) { }

  ngOnInit(): void {
    this.guardrailsService.getGuardrailsLogs().subscribe(logs => this.logs = logs);
  }

  formatDate(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }
}
