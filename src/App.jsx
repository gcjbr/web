import { useState, useEffect, useCallback, useRef } from "react";
import UserCard from "./UserCard";

function App() {
  const usersToKeep = 20;
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState(new Map());
  const [usersEmpty, setUsersEmpty] = useState([]);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(0);
  const [firstElement, setFirstElement] = useState(0);
  const [y, setY] = useState(window.scrollY);
  const direction = useRef("down");
  const fetchUsers = async (front = true, page) => {
    if (loading) {
      return;
    }

    setLoading(true);
    const response = await fetch(
      "http://localhost:8000/api/users?page=" + page
    );
    const data = await response.json();
    if (users.size >= usersToKeep) {
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
        if (data.current_page <= 2) {
          setUsersEmpty(Array(usersToKeep).fill(null));
        } else {
          setUsersEmpty(Array(perPage * data.current_page).fill(null));
        }
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
        if (data.current_page <= 2) {
          setUsersEmpty(Array(usersToKeep).fill(null));
        } else {
          setUsersEmpty(Array(perPage * data.current_page).fill(null));
        }
      }
    } else {
      // Only runs on mount
      const usersMap = new Map();
      let i = data.current_page * perPage - perPage + 1;
      data.data.forEach((user) => {
        usersMap.set(i, user);
        i++;
      });

      setUsers(new Map([...users, ...usersMap]));
      setUsersEmpty(Array(perPage * data.current_page).fill(null));
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

  return (
    <div className="flex flex-col justify-center max-w-lg  mx-auto p-5">
      {usersEmpty.map((item, index) => {
        if (index === firstElement) {
          return (
            <div ref={firstUserRef}>
              <UserCard user={users.get(index + 1)} />
            </div>
          );
        }
        if (index + 1 === usersEmpty.length) {
          return (
            <div ref={lastUserRef}>
              <UserCard user={users.get(index + 1)} />
            </div>
          );
        }
        return (
          <div>
            <UserCard user={users.get(index + 1)} />
          </div>
        );
      })}
    </div>
  );
}

export default App;
