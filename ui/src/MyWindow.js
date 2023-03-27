import React from 'react';
import { Window } from '@progress/kendo-react-dialogs';
import { Grid, GridColumn } from "@progress/kendo-react-grid";
import { DateTime } from 'luxon';
import { orderBy } from "@progress/kendo-data-query";
import './MyWindow.css';

const MyWindow = (props) => {

  const { person, toggleDialog } = props;

  const sortInit = [{
    field: "start",
    dir: "desc",
  }];
  const [sort, setSort] = React.useState(sortInit);

  // Consolidate events from events and activities objects
  const getEvents = (person) => {
    let eventsArr = Array.isArray(person.events.event) ? 
    person.events.event : [person.events.event];
    let activitiesArr = Array.isArray(person.activities.activity) ? 
    person.activities.activity : [person.activities.activity];
    let evs = eventsArr.map(ev => {
      return {
        name: ev.place,
        start: DateTime.fromISO(ev.start).toISODate()
      }
    })
    let acts = activitiesArr.map(act => {
      return {
        name: act.place,
        start: DateTime.fromISO(act.ts).toISODate()
      }
    })
    return [...evs, ...acts];
  }

  return (
    <Window 
      title={person && person.nameGroup.fullname.value} 
      onClose={toggleDialog} 
      initialHeight={540}
      initialWidth={440}
      initialTop={20}
      initialLeft={1100}
    >
      { person && <div style={{display: "flex", justifyContent: "space-between"}}>
        <div>
          <div className="item">
            {person.addresses.address.street}<br />
            {person.addresses.address.city}, {person.addresses.address.state} {person.addresses.address.postal}
          </div>
          <div className="item email">
            { Array.isArray(person.emails.email) ? person.emails.email[0].value : person.emails.email.value }
          </div>
          <div className="item">{person.phone}</div>
          <div className="item">{person.status}</div>
        </div>
        <div>
          <img className="image" src={person.images.image[0].url} /> 
        </div>
      </div>}
      { person && <div className="gridContainer"><Grid
          data={orderBy(getEvents(person), sort)}
          sortable={true}
          sort={sort}
          onSortChange={(e) => {
            setSort(e.sort);
          }}
        >
        <GridColumn field="name" title="Company" />
        <GridColumn field="start" title="Start Date" />
      </Grid></div> }
    </Window>
  );
}

export default MyWindow;
