import React from 'react';
import './MySelected.css';

const MySelected = (props) => {

  const { selected, total } = props;

  return (
    selected && <div id="selectedContainer">
      <span id="selected">{selected}</span>&nbsp;has&nbsp;
      <span id="numResults">{total}</span>&nbsp;
      {total===1 ? 'result' : 'results'}
    </div>
  );
}

export default MySelected;
