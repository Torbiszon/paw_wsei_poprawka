import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cors from 'cors';
import { MongoClient, Db } from 'mongodb';

dotenv.config();

const app = express();
const port = 3000;
//2137
const tokenSecret = process.env.TOKEN_SECRET as string;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET as string;
let db: Db;

const mongoClient = new MongoClient(process.env.MONGODB_URI as string);

mongoClient.connect()
  .then(client => {
    db = client.db();
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Hello World - simple API with JWT and MongoDB!');
});

app.post('/login', async (_req, res) => {
  const { username, password } = _req.body;
  console.log(`Attempting login for user: ${username}`);

  try {
    const user = await db.collection('users').findOne({ username, password });

    if (user) {
      console.log(`User found: ${JSON.stringify(user, null, 2)}`); 
      const token = generateToken({ username: user.username, role: user.role }, 900); // 15 minutes
      const refreshToken = generateRefreshToken({ username: user.username, role: user.role });

      await db.collection('refreshTokens').insertOne({ refreshToken });

      res.status(200).send({ token, refreshToken, userId: user.id });
    } else {
      res.status(401).send('Username or password incorrect');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('Internal server error');
  }
});

app.post('/token', async (_req, res) => {
  const { token, exp } = _req.body;

  if (!token) return res.sendStatus(401);

  try {
    const tokenExists = await db.collection('refreshTokens').findOne({ refreshToken: token });

    if (!tokenExists) return res.sendStatus(403);

    jwt.verify(token, refreshTokenSecret, (err: any, user: any) => {
      if (err) return res.sendStatus(403);

      const newToken = generateToken({ username: user.username, role: user.role }, exp || 900); // 15 minutes
      res.status(200).send({ token: newToken });
    });
  } catch (error) {
    console.error('Token error:', error);
    res.status(500).send('Internal server error');
  }
});

app.post('/refreshToken', async (_req, res) => {
  const { refreshToken } = _req.body;

  if (!refreshToken) return res.sendStatus(401);

  try {
    const tokenExists = await db.collection('refreshTokens').findOne({ refreshToken });

    if (!tokenExists) return res.sendStatus(403);

    jwt.verify(refreshToken, refreshTokenSecret, async (err: any, user: any) => {
      if (err) return res.sendStatus(403);

      const newToken = generateToken({ username: user.username, role: user.role }, 900); // 15 minutes
      const newRefreshToken = generateRefreshToken({ username: user.username, role: user.role });

      await db.collection('refreshTokens').deleteOne({ refreshToken });
      await db.collection('refreshTokens').insertOne({ refreshToken: newRefreshToken });

      res.status(200).send({ token: newToken, refreshToken: newRefreshToken });
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).send('Internal server error');
  }
});

app.post('/saveTokens', async (_req, res) => {
  const { token, refreshToken } = _req.body;
  try {
    await db.collection('tokens').insertOne({ token, refreshToken });
    res.status(200).send('Tokens saved successfully');
  } catch (error) {
    res.status(500).send('Failed to save tokens');
  }
});

app.get('/checkTokens', async (_req, res) => {
  try {
    console.log(_req);
    const tokens = await db.collection('tokens').findOne({});
    res.status(200).json(tokens);
  } catch (error) {
    res.status(500).send('Failed to check tokens');
  }
});

app.get('/protected/:id/:delay?', verifyToken, (_req, res) => {
  const id = _req.params.id;
  const delay = _req.params.delay ? +_req.params.delay : 1000;
  setTimeout(() => {
    res.status(200).send(`{"message": "protected endpoint ${id}"}`);
  }, delay);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

function generateToken(user: any, expirationInSeconds: number) {
  return jwt.sign({ user, exp: Math.floor(Date.now() / 1000) + expirationInSeconds }, tokenSecret, { algorithm: 'HS256' });
}

function generateRefreshToken(user: any) {
  return jwt.sign({ user }, refreshTokenSecret, { algorithm: 'HS256' });
}

function verifyToken(_req: any, res: any, next: any) {
  const authHeader = _req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(403);

  jwt.verify(token, tokenSecret, (err: any, user: any) => {
    if (err) {
      return res.status(401).send(err.message);
    }
    _req.user = user;
    next();
  });
}

//Users
app.get('/users', async (_req, res) => {
  try {
    const users = await db.collection('users').find().toArray();
    res.status(200).json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).send('Failed to fetch users');
  }
});


// Projects
app.get('/projects', async (_req, res) => {
  try {
    const projects = await db.collection('projects').find().toArray();
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).send('Failed to fetch projects');
  }
});

app.post('/projects', async (_req, res) => {
  try {
    const project = _req.body;
    await db.collection('projects').insertOne(project);
    res.status(201).send('Project created successfully');
  } catch (error) {
    res.status(500).send('Failed to create project');
  }
});

app.delete('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('projects').deleteOne({ id: parseInt(id) });

    if (result.deletedCount === 1) {
      res.status(200).send('Project deleted successfully');
    } else {
      res.status(404).send('Project not found');
    }
  } catch (error) {
    res.status(500).send('Failed to delete project');
  }
});


app.put('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const result = await db.collection('projects').updateOne(
      { id: parseInt(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 1) {
      res.status(200).send('Project updated successfully');
    } else {
      res.status(404).send('Project not found');
    }
  } catch (error) {
    res.status(500).send('Failed to update project');
  }
});


// Scenarios
app.get('/scenarios', async (_req, res) => {
  try {
    const scenarios = await db.collection('scenarios').find().toArray();
    res.status(200).json(scenarios);
  } catch (error) {
    res.status(500).send('Failed to fetch scenarios');
  }
});

app.get('/scenarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const scenario = await db.collection('scenarios').findOne({ id: parseInt(id) });
    if (scenario) {
      res.status(200).json(scenario);
    } else {
      res.status(404).send('Scenario not found');
    }
  } catch (error) {
    res.status(500).send('Failed to fetch scenario');
  }
});

app.get('/projects/:projectId/scenarios', async (req, res) => {
  const { projectId } = req.params;
  try {
    const scenarios = await db.collection('scenarios').find({ projectId: parseInt(projectId) }).toArray();
    res.json(scenarios);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

app.post('/scenarios', async (_req, res) => {
  try {
    const scenario = _req.body;
    await db.collection('scenarios').insertOne(scenario);
    res.status(201).send('Scenario created successfully');
  } catch (error) {
    res.status(500).send('Failed to create scenario');
  }
});

app.put('/scenarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const result = await db.collection('scenarios').updateOne(
      { id: parseInt(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 1) {
      res.status(200).send('Scenario updated successfully');
    } else {
      res.status(404).send('Scenario not found');
    }
  } catch (error) {
    res.status(500).send('Failed to update scenario');
  }
});

app.delete('/scenarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('scenarios').deleteOne({ id: parseInt(id) });

    if (result.deletedCount === 1) {
      res.status(200).send('Scenario deleted successfully');
    } else {
      res.status(404).send('Scenario not found');
    }
  } catch (error) {
    res.status(500).send('Failed to delete scenario');
  }
});

app.delete('/projects/:projectId/scenarios', async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await db.collection('scenarios').deleteMany({ projectId: parseInt(projectId) });
    if (result.deletedCount > 0) {
      res.status(200).send('Scenarios deleted successfully');
    } else {
      res.status(404).send('No scenarios found for this project');
    }
  } catch (error) {
    console.error('Failed to delete scenarios:', error);
    res.status(500).send('Failed to delete scenarios');
  }
});


// Tasks
app.get('/tasks', async (_req, res) => {
  try {
    const tasks = await db.collection('tasks').find().toArray();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).send('Failed to fetch tasks');
  }
});

app.get('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const task = await db.collection('tasks').findOne({ id: parseInt(id) });
    if (task) {
      res.status(200).json(task);
    } else {
      res.status(404).send('Task not found');
    }
  } catch (error) {
    res.status(500).send('Failed to fetch task');
  }
});

app.get('/scenarios/:scenarioId/tasks', async (req, res) => {
  const { scenarioId } = req.params;
  try {
    const tasks = await db.collection('tasks').find({ scenarioId: parseInt(scenarioId) }).toArray();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/tasks', async (_req, res) => {
  try {
    const task = _req.body;
    await db.collection('tasks').insertOne(task);
    res.status(201).send('Task created successfully');
  } catch (error) {
    res.status(500).send('Failed to create task');
  }
});

app.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    delete updateData._id;

    const result = await db.collection('tasks').updateOne(
      { id: parseInt(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 1) {
      res.status(200).send('Task updated successfully');
    } else {
      res.status(404).send('Task not found');
    }
  } catch (error) {
    console.error('Failed to update task:', error);
    res.status(500).send('Failed to update task');
  }
});

app.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('tasks').deleteOne({ id: parseInt(id) });

    if (result.deletedCount === 1) {
      res.status(200).send('Task deleted successfully');
    } else {
      res.status(404).send('Task not found');
    }
  } catch (error) {
    res.status(500).send('Failed to delete task');
  }
});



// Current ID management
app.get('/currentProjectId', async (_req, res) => {
  try {
    const idDoc = await db.collection('currentIds').findOne({ type: 'project' });
    res.status(200).json({ currentProjectId: idDoc ? idDoc.currentId : 0 });
  } catch (error) {
    res.status(500).send('Failed to get current project ID');
  }
});

app.post('/currentProjectId', async (_req, res) => {
  try {
    const { id } = _req.body;
    await db.collection('currentIds').updateOne({ type: 'project' }, { $set: { currentId: id } }, { upsert: true });
    res.status(200).send('Current project ID set successfully');
  } catch (error) {
    res.status(500).send('Failed to set current project ID');
  }
});

app.get('/currentScenarioId', async (_req, res) => {
  try {
    const idDoc = await db.collection('currentIds').findOne({ type: 'scenario' });
    res.status(200).json({ currentScenarioId: idDoc ? idDoc.currentId : 0 });
  } catch (error) {
    res.status(500).send('Failed to get current scenario ID');
  }
});

app.post('/currentScenarioId', async (_req, res) => {
  try {
    const { id } = _req.body;
    await db.collection('currentIds').updateOne({ type: 'scenario' }, { $set: { currentId: id } }, { upsert: true });
    res.status(200).send('Current scenario ID set successfully');
  } catch (error) {
    res.status(500).send('Failed to set current scenario ID');
  }
});

app.get('/currentTaskId', async (_req, res) => {
  try {
    const idDoc = await db.collection('currentIds').findOne({ type: 'task' });
    res.status(200).json({ currentTaskId: idDoc ? idDoc.currentId : 0 });
  } catch (error) {
    res.status(500).send('Failed to get current task ID');
  }
});

app.post('/currentTaskId', async (_req, res) => {
  try {
    const { id } = _req.body;
    await db.collection('currentIds').updateOne({ type: 'task' }, { $set: { currentId: id } }, { upsert: true });
    res.status(200).send('Current task ID set successfully');
  } catch (error) {
    res.status(500).send('Failed to set current task ID');
  }
});
