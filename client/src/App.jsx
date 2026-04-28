import { useEffect, useState } from 'react';
import $ from 'jquery';
import ContactForm from './components/ContactForm.jsx';
import ContactTable from './components/ContactTable.jsx';

const API_URL = 'http://localhost:5000/api/contacts';

export default function App() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadContacts() {
    const response = await fetch(API_URL);
    const data = await response.json();
    setContacts(data);
    setLoading(false);
  }

  async function createContact(contact) {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    });

    await loadContacts();

    $('.flash-message')
      .stop(true, true)
      .text('Contact saved successfully.')
      .fadeIn(200)
      .delay(900)
      .fadeOut(300);
  }

  async function deleteContact(id) {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    await loadContacts();
  }

  useEffect(() => {
    loadContacts();
  }, []);

  return (
    <div className="container py-4">
      <h1 className="mb-1">CRM App</h1>
      <p className="text-muted">React + MongoDB + Bootstrap 5 + jQuery</p>

      <div className="alert alert-success flash-message" role="alert" style={{ display: 'none' }} />

      <ContactForm onSave={createContact} />
      {loading ? <div className="mt-4">Loading contacts...</div> : <ContactTable contacts={contacts} onDelete={deleteContact} />}
    </div>
  );
}
