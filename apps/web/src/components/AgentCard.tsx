import React from 'react';

type Props = {
  name: string;
  role: string;
  status: string;
};

export function AgentCard({ name, role, status }: Props) {
  return (
    <div
      style={{
        border: '1px solid #333',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12
      }}
    >
      <h3>{name}</h3>
      <p>{role}</p>
      <strong>Status: {status}</strong>
    </div>
  );
}
