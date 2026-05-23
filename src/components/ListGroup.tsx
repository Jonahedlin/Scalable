import { useState } from "react";

interface Props {
  items: string[];
  heading: string;
  onSelectItem: (item: string) => void;
}

function ListGroup({ items, heading, onSelectItem}: Props) {
  //HOOK (this component has data that will change overtime)
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [count, setCount] = useState(0);

  return (
    <>
      <h1>{heading}</h1>
      <ul className="list-group">
        {items.map((item, index) => (
          <li
            className={
              selectedIndex === index
                ? "list-group-item active"
                : "list-group-item"
            }
            key={item}
            onClick={() => {
              setSelectedIndex(index);
              onSelectItem(item);
            }}
          >
            {item}
          </li>
        ))}
      </ul>
      <h3>Count: {count} </h3>
      <button
        type="button"
        className="btn btn-dark"
        onClick={() => setCount(count + 1)}
      >
        Counter
      </button>
    </>
  );
}
export default ListGroup;
