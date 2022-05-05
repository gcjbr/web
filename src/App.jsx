import { useState, useEffect, useCallback, useRef } from "react";
import UserCard from "./UserCard";

function App() {
  const usersToKeep = 20;
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState(new Map());
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(0);
  const [firstElement, setFirstElement] = useState(0);
  const [y, setY] = useState(window.scrollY);
  const direction = useRef("down");
  const offsetHeight = useRef(0);
  const fetchUsers = async (front = true, page) => {
    if (loading) {
      return;
    }

    setLoading(true);
    const response = await fetch(
      "http://localhost:8000/api/users?page=" + page
    );
    const data = await response.json();
    if (users.size > 0) {
      if (front) {
        const newUsers = users;
        // If stored users are already the total allowed, remove the total we are going to add
        if (newUsers.size >= usersToKeep) {
          for (let i = 0; i < perPage; i++) {
            newUsers.delete(newUsers.keys().next().value);
          }
        }
        // Calculate current index based on the page
        let i = data.current_page * perPage - perPage + 1;

        // Add the sers map
        data.data.forEach((user) => {
          newUsers.set(i, user);
          i++;
        });

        setFirstElement(newUsers.keys().next().value);

        setUsers(newUsers);
      }

      if (!front) {
        const usersMap = new Map();

        let i = data.current_page * perPage - perPage + 1;
        data.data.forEach((user) => {
          usersMap.set(i, user);
          i++;
        });

        for (let y = i; y < i + perPage; y++) {
          usersMap.set(y, users.get(y));
        }

        setUsers(new Map([...usersMap]));
        setFirstElement(usersMap.keys().next().value);
      }

      const offsetPage = 100 * perPage * data.current_page;

      if (data.currentPage < 3) {
        offsetHeight.current = 0;
      } else {
        offsetHeight.current = offsetPage;
      }
      console.log(
        "🚀 ~ fetchUsers ~ offsetHeight.current",
        offsetHeight.current
      );
    } else {
      // Only runs on mount

      const usersMap = new Map();
      let i = data.current_page * perPage - perPage + 1;
      data.data.forEach((user) => {
        usersMap.set(i, user);
        i++;
      });

      setUsers(new Map([...usersMap]));

      setPerPage(data.per_page);
      setLastPage(data.last_page);
    }

    setCurrentPage(data.current_page);
    setLoading(false);
  };

  const handleNavigation = useCallback(
    (e) => {
      const window = e.currentTarget;
      if (y > window.scrollY) {
        direction.current = "up";
      } else if (y < window.scrollY) {
        direction.current = "down";
      }
      setY(window.scrollY);
    },
    [y]
  );

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      fetchUsers(true, 1);
    }

    setY(window.scrollY);
    window.addEventListener("scroll", handleNavigation);

    return () => {
      window.removeEventListener("scroll", handleNavigation);
    };
  }, [handleNavigation]);

  const firstObserver = useRef();
  const firstUserRef = useCallback((node) => {
    if (loading) {
      return;
    }
    if (firstObserver.current) {
      firstObserver.current.disconnect();
    }
    firstObserver.current = new IntersectionObserver((entries) => {
      if (
        entries[0].isIntersecting &&
        currentPage !== 1 &&
        direction.current === "up"
      ) {
        fetchUsers(false, currentPage - 1);
      }
    });

    if (node) {
      firstObserver.current.observe(node);
    }
  });

  const lastObserver = useRef();
  const lastUserRef = useCallback(
    (node) => {
      if (loading) {
        return;
      }

      if (lastObserver.current) {
        lastObserver.current.disconnect();
      }

      lastObserver.current = new IntersectionObserver((entries) => {
        if (
          entries[0].isIntersecting &&
          currentPage < lastPage &&
          direction.current === "down"
        ) {
          fetchUsers(true, currentPage + 1);
        }
      });

      if (node) {
        lastObserver.current.observe(node);
      }
    },
    [loading]
  );

  const content = () => {
    const list = [];
    const from = currentPage <= 2 ? 1 : currentPage * perPage - usersToKeep;
    const to = currentPage <= 2 ? usersToKeep : currentPage * perPage;
    let y = 1;
    for (let i = from; i < to; i++) {
      if (users.has(i)) {
        if (i === firstElement) {
          list.push(
            <div ref={firstUserRef} style={{ backgroundColor: "red" }}>
              <UserCard user={users.get(i)} />
            </div>
          );
        } else if (y + 1 === users.size) {
          list.push(
            <div ref={lastUserRef}>
              <UserCard
                user={users.get(i)}
                style={{ backgroundColor: "blue" }}
              />
            </div>
          );
        } else {
          list.push(
            <div>
              <UserCard user={users.get(i)} />
            </div>
          );
        }

        y++;
      }
    }
    return list;
  };

  return (
    <div className="flex flex-col justify-center max-w-lg  mx-auto p-5">
      <div
        style={{
          width: "1px",
          height: `${offsetHeight.current}px`,
        }}
      />
      {content()}
    </div>
  );
}

export default App;
