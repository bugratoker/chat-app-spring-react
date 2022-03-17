import React from 'react';

function App() {
  return (
    <button value="hello!" onClick={e => alert(e.target.value)}>
      Click me!
    </button>
  );
}

export default App;