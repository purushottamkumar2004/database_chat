import React from 'react';

function ResultsTable({ data }) {
  // If there's no data or the data array is empty, don't render anything.
  if (!data || data.length === 0) {
    return <p>No results found.</p>;
  }

  // Get the table headers from the keys of the first object in the data array.
  const headers = Object.keys(data[0]);

  return (
    <table>
      <thead>
        <tr>
          {headers.map(header => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={index}>
            {headers.map(header => (
              <td key={header}>{String(item[header])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ResultsTable;