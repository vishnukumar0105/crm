export default function ContactTable({ contacts, onDelete }) {
  return (
    <div className="card shadow-sm mt-4">
      <div className="card-body">
        <h5 className="card-title">Contacts</h5>
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Company</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">No contacts yet.</td>
                </tr>
              )}
              {contacts.map((contact) => (
                <tr key={contact._id}>
                  <td>{contact.name}</td>
                  <td>{contact.email}</td>
                  <td>{contact.phone}</td>
                  <td>{contact.company || '-'}</td>
                  <td>
                    <span className="badge text-bg-secondary">{contact.status}</span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(contact._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
