import { Component, OnInit } from '@angular/core';
import { ManagerService } from '../../services/manager.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  engineers: any[] = [];
  currentPage = 1;
  perPage = 6;
  totalEngineers = 0;
  isLoading = false;
  selectedEngineer: any = null;
  isBalanceModalOpen = false;

  constructor(private managerService: ManagerService) {}

  ngOnInit() {
    this.loadNextPage();
  }

  loadNextPage(): void {
    if (this.isLoading) return;
    this.isLoading = true;

    this.managerService
      .fetchEngineersPage(this.currentPage, this.perPage)
      .subscribe((response) => {
        this.engineers.push(...response.engineers);
        this.totalEngineers = response.total;
        this.currentPage++;
        this.isLoading = false;
      });
  }

  openBalanceModal(engineer: any): void {
    this.selectedEngineer = engineer;
    this.isBalanceModalOpen = true;

    const amountInput = document.getElementById(
      'balance-amount'
    ) as HTMLInputElement;
    if (amountInput) {
      amountInput.value = '';
    }

    const addRadio = document.querySelector<HTMLInputElement>(
      'input[name="operation"][value="add"]'
    );
    if (addRadio) {
      addRadio.checked = true;
    }
  }

  get hasMoreEngineers(): boolean {
    return this.engineers.length < this.totalEngineers;
  }

  closeBalanceModal() {
    this.isBalanceModalOpen = false;
  }

  adjustBalance() {
    if (!this.selectedEngineer) return;

    const operationInput = document.querySelector<HTMLInputElement>(
      'input[name="operation"]:checked'
    );
    const amountInput = document.getElementById(
      'balance-amount'
    ) as HTMLInputElement;

    if (!operationInput || !amountInput) {
      return;
    }

    const operation = operationInput.value;
    const amount = parseFloat(amountInput.value);

    if (isNaN(amount) || amount <= 0) {
      return;
    }

    let currentBalance = parseFloat(this.selectedEngineer.balance);
    if (isNaN(currentBalance)) currentBalance = 0;

    let newBalance =
      operation === 'add' ? currentBalance + amount : currentBalance - amount;

    this.managerService
      .updateEngineerBalance(this.selectedEngineer.user_id, newBalance)
      .subscribe((res) => {
        if (res && res.message === 'Balance updated successfully') {
          const formattedBalance = Number.isInteger(newBalance)
            ? newBalance.toString()
            : newBalance.toFixed(2);

          this.selectedEngineer.balance = formattedBalance;
          this.closeBalanceModal();
        }
      });
  }

  newEmployee = {
    role: 'engineer',
    name: '',
    login: '',
    password: '',
  };

  canCreateEmployee(): boolean {
    return (
      this.newEmployee.role.trim() !== '' &&
      this.newEmployee.name.trim() !== '' &&
      this.newEmployee.login.trim() !== '' &&
      this.newEmployee.password.trim() !== ''
    );
  }

  createEmployee() {
    if (!this.canCreateEmployee()) return;

    const employeeData = {
      role: this.newEmployee.role,
      name: this.newEmployee.name.trim(),
      login: this.newEmployee.login.trim(),
      password: this.newEmployee.password,
    };

    this.managerService.createUser(employeeData).subscribe((res) => {
      if (res && res.user_id) {
        this.newEmployee = {
          role: 'engineer',
          name: '',
          login: '',
          password: '',
        };
      }
    });
  }
}
