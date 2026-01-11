document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('kiit_token');
  if (!token) {
    alert('Please login as admin');
    window.location.href = 'index.html';
    return;
  }

  try {
    // Fetch users
    const res = await fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    const tbody = document.getElementById('user-list');
    tbody.innerHTML = data.users.map(user => `
      <tr>
        <td>${user.name}</td>
        <td>${user.roll}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td>
          <button class="approve-btn" onclick="approveUser('${user.id}')">Approve as Admin</button>
          <button class="delete-btn" onclick="deleteUser('${user.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    alert('Error: ' + err.message);
  }
});

async function approveUser(id) {
  if (!confirm('Approve as admin?')) return;
  const token = localStorage.getItem('kiit_token');
  try {
    const res = await fetch(`/api/admin/user/${id}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      alert('Approved!');
      location.reload();
    } else throw new Error(data.error);
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function deleteUser(id) {
  if (!confirm('Delete user?')) return;
  const token = localStorage.getItem('kiit_token');
  try {
    const res = await fetch(`/api/admin/user/${id}/delete`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      alert('Deleted!');
      location.reload();
    } else throw new Error(data.error);
  } catch (err) {
    alert('Error: ' + err.message);
  }
}