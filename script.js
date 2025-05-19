const apiUrl = "http://localhost:3000";

document.addEventListener('DOMContentLoaded', () => {

  // Utility to strip non-digit characters from phone
  function normalizePhone(phone) {
    return phone.replace(/\D/g, '');
  }

  // ---------- LOGIN / REGISTER ----------
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const rawPhone = document.getElementById('phone').value;
      const phone = normalizePhone(rawPhone);
      const password = document.getElementById('password').value;

      try {
        const res = await fetch(`${apiUrl}/users`);
        if (!res.ok) throw new Error('Network error fetching users');
        const users = await res.json();

        let user = users.find(u => normalizePhone(u.phone) === phone);

        if (user) {
          if (user.password !== password) {
            alert('Wrong password!');
            return;
          }
        } else {
          // Register new user with initial balance 1000
          const createRes = await fetch(`${apiUrl}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password, balance: 1000 })
          });
          if (!createRes.ok) throw new Error('Failed to create user');
          user = await createRes.json();
        }

        // Save normalized phone in localStorage
        localStorage.setItem('phone', phone);
        window.location.href = "home.html";

      } catch (err) {
        alert('Error during login/registration: ' + err.message);
        console.error(err);
      }
    });
  }


  // ---------- HOME PAGE ----------
  const paymentForm = document.getElementById('paymentForm');
  if (paymentForm) {
    const phone = localStorage.getItem('phone');
    if (!phone) {
      alert('You are not logged in!');
      window.location.href = 'index.html';
      return;
    }

    // Display user phone in UI (formatted)
    const userPhoneElem = document.getElementById('userPhone');
    if (userPhoneElem) {
      // Format as (123) 456-7890
      const formattedPhone = phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
      userPhoneElem.textContent = formattedPhone;
    }

    async function loadUserData() {
      try {
        const res = await fetch(`${apiUrl}/users`);
        if (!res.ok) throw new Error('Failed to fetch users');
        const users = await res.json();
        const user = users.find(u => normalizePhone(u.phone) === phone);
        if (user) {
          document.getElementById('balance').textContent = user.balance.toFixed(2);
        } else {
          alert('User not found');
          window.location.href = 'index.html';
        }
      } catch (err) {
        alert('Error loading user data: ' + err.message);
        console.error(err);
      }
    }

    async function loadTransactions() {
      try {
        const res = await fetch(`${apiUrl}/transactions`);
        if (!res.ok) throw new Error('Failed to fetch transactions');
        const transactions = await res.json();

        const list = document.getElementById('transactionList');
        list.innerHTML = '';

        transactions
          .filter(t => normalizePhone(t.sender) === phone || normalizePhone(t.receiver) === phone)
          .forEach(t => {
            const li = document.createElement('li');
            li.textContent = `${t.sender} sent $${t.amount.toFixed(2)} to ${t.receiver}`;
            list.appendChild(li);
          });
      } catch (err) {
        alert('Error loading transactions: ' + err.message);
        console.error(err);
      }
    }

    loadUserData();
    loadTransactions();

    paymentForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const receiverRaw = document.getElementById('receiverPhone').value;
      const receiverPhone = normalizePhone(receiverRaw);
      const amount = parseFloat(document.getElementById('amount').value);

      if (isNaN(amount) || amount <= 0) {
        alert('Amount must be a positive number!');
        return;
      }

      if (receiverPhone === phone) {
        alert('You cannot send money to yourself!');
        return;
      }

      try {
        // Fetch users fresh for balances
        const res = await fetch(`${apiUrl}/users`);
        if (!res.ok) throw new Error('Failed to fetch users');
        const users = await res.json();

        const sender = users.find(u => normalizePhone(u.phone) === phone);
        const receiver = users.find(u => normalizePhone(u.phone) === receiverPhone);

        if (!receiver) {
          alert('Receiver not found!');
          return;
        }

        if (sender.balance < amount) {
          alert('Not enough balance!');
          return;
        }

        // Update sender balance
        const patchSender = await fetch(`${apiUrl}/users/${sender.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ balance: sender.balance - amount })
        });
        if (!patchSender.ok) throw new Error('Failed to update sender balance');

        // Update receiver balance
        const patchReceiver = await fetch(`${apiUrl}/users/${receiver.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ balance: receiver.balance + amount })
        });
        if (!patchReceiver.ok) throw new Error('Failed to update receiver balance');

        // Create transaction record
        const createTransaction = await fetch(`${apiUrl}/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: phone,
            receiver: receiverPhone,
            amount,
            timestamp: new Date().toISOString()
          })
        });
        if (!createTransaction.ok) throw new Error('Failed to create transaction');

        alert('Payment sent successfully!');
        loadUserData();
        loadTransactions();

        paymentForm.reset();

      } catch (err) {
        alert('Error sending payment: ' + err.message);
        console.error(err);
      }
    });
  }


  // ---------- MOBILE DROPDOWN ----------
  document.querySelectorAll('.dropdown > a').forEach(link => {
    link.addEventListener('click', function (e) {
      if (window.innerWidth < 768) { // Mobile only
        e.preventDefault();
        const dropdown = this.parentElement;
        const content = dropdown.querySelector('.dropdown-content');
        content.style.display = content.style.display === 'block' ? 'none' : 'block';
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.matches('.dropdown > a')) {
      document.querySelectorAll('.dropdown-content').forEach(content => {
        content.style.display = 'none';
      });
    }
  });


  // ---------- PHONE INPUT FORMATTING & VALIDATION ----------
  const phoneInput = document.getElementById('phoneNumber');
  const phoneForm = document.getElementById('phoneForm');
  const clearButton = document.getElementById('clearButton');

  if (phoneInput && phoneForm && clearButton) {
    phoneInput.setAttribute('data-empty', 'true');

    phoneInput.addEventListener('input', (e) => {
      const cleaned = e.target.value.replace(/\D/g, '');

      if (cleaned.length > 0) {
        phoneInput.setAttribute('data-empty', 'false');
        const match = cleaned.match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
        e.target.value = !match[2]
          ? match[1]
          : `(${match[1]}) ${match[2]}${match[3] ? `-${match[3]}` : ''}`;
        clearButton.style.display = 'block';
      } else {
        phoneInput.setAttribute('data-empty', 'true');
        e.target.value = '';
        clearButton.style.display = 'none';
      }
    });

    phoneInput.addEventListener('keydown', (e) => {
      const cursorPos = e.target.selectionStart;
      const value = e.target.value;
      if (
        (e.key === 'Backspace' || e.key === 'Delete') &&
        ['(', ')', ' ', '-'].includes(value[cursorPos - 1])
      ) {
        e.preventDefault();
        const offset = e.key === 'Backspace' ? -1 : 1;
        e.target.setSelectionRange(cursorPos + offset, cursorPos + offset);
      }
    });

    phoneForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const phoneValue = phoneInput.value.trim();
      const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;

      if (!phoneValue) {
        alert('Please enter your phone number.');
      } else if (!phoneRegex.test(phoneValue)) {
        alert('Please enter a valid phone number in the format (XXX) XXX-XXXX.');
      } else {
        alert('Code sent to ' + phoneValue);
        // window.location.href = 'verify-code.html';
      }
    });

    document.querySelector('.phone-input-container').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) phoneInput.focus();
      setTimeout(() => {
        if (phoneInput.selectionStart < 1) {
          phoneInput.setSelectionRange(1, 1);
        }
      }, 0);
    });

    clearButton.addEventListener('click', () => {
      phoneInput.value = '';
      clearButton.style.display = 'none';
      phoneInput.focus();
    });
  }

});
